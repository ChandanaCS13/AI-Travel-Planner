import { NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"

export async function POST(req: Request) {
  try {
    const { destination: rawDestination } = await req.json()
    if (!rawDestination || typeof rawDestination !== "string") {
      return NextResponse.json({ error: "Destination is required" }, { status: 400 })
    }

    // 1. Intelligent Query Parser: Extract clean destination and requested duration
    const { cleanDest, duration } = parseSearchQuery(rawDestination)

    // Read API key from server environment variables
    const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY

    // Fallback: If no API key, generate a high-quality procedurally customized mock response matching requested days
    if (!apiKey) {
      console.log(`No Gemini API key found. Generating procedural mock fallback for: ${cleanDest} (${duration} Days)`)
      const mockData = generateProceduralItinerary(cleanDest, duration)
      return NextResponse.json({ ...mockData, isDemo: true })
    }

    const genAI = new GoogleGenerativeAI(apiKey)
    // Using the high-performance gemini-3.5-flash model as requested
    const model = genAI.getGenerativeModel({
      model: "gemini-3.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
      },
    })

    const prompt = `You are a premium luxury travel concierge and local specialist. Create an ultra-detailed, highly engaging, and aesthetically refined travel blueprint for "${cleanDest}" for exactly ${duration} days.
Return your response strictly as a JSON object adhering exactly to this structure (with no extra markdown or wrappers, just the raw JSON):

{
  "destination": "${cleanDest} - ${duration} Day Blueprint",
  "days": [
    {
      "num": 1,
      "title": "Day Title (e.g. Immersion & Historic Landmarks)",
      "description": "Brief thematic description of this day's mood.",
      "activities": [
        {
          "time": "Morning | Afternoon | Evening",
          "spot": "Spot or attraction name",
          "desc": "A compelling description of what to do, what to look for, and the vibe.",
          "tips": "An insider local tip or hidden secret detail (e.g. secret path, best photo timing, local treat nearby).",
          "attire": "Recommended gear, attire, or custom (e.g. slip-on shoes, warm jacket, temple cover-up).",
          "duration": "Estimated time duration (e.g. 1.5 - 2 Hours).",
          "cost": "Admission price or food cost range (e.g. Free, $15 USD, Varies)."
        }
      ]
    }
  ],
  "stays": [
    {
      "name": "Boutique Hotel or Stay name",
      "vibe": "E.g. Traditional Luxury, Eco-chic, Ultra-modern",
      "price": "$$$ / Night range",
      "desc": "Rich, appealing description of why it fits this destination.",
      "emoji": "🏨 or appropriate stay emoji"
    }
  ],
  "food": [
    {
      "dish": "Dish Name",
      "restaurant": "Restaurant Name or Street Market",
      "desc": "Sensory description of the dish and dining experience.",
      "priceRange": "$ / $$ / $$$",
      "emoji": "🍜 or appropriate food emoji"
    }
  ],
  "tips": [
    "Compelling localized tip 1",
    "Compelling localized tip 2",
    "Compelling localized tip 3"
  ]
}

Please provide EXACTLY ${duration} distinct days (from Day 1 to Day ${duration}) with 3 structured activities per day, 3 stay recommendations, 3 dining recommendations, and 4 insightful local tips. Make sure each activity contains highly descriptive detail for the tips, attire, duration, and cost properties.`

    const result = await model.generateContent(prompt)
    const textResponse = result.response.text()

    try {
      const parsedData = JSON.parse(textResponse)
      return NextResponse.json({ ...parsedData, isDemo: false })
    } catch (parseError) {
      console.error("Failed to parse Gemini JSON response, text was:", textResponse)
      // If parsing fails, fall back to procedural data
      return NextResponse.json({ ...generateProceduralItinerary(cleanDest, duration), isDemo: true })
    }

  } catch (error: any) {
    console.error("Gemini API route error:", error)
    return NextResponse.json({ error: error.message || "Failed to generate itinerary" }, { status: 500 })
  }
}

// ─── Query Parser Utility ────────────────────────────────────────────────────

function parseSearchQuery(query: string) {
  const lowercaseQuery = query.toLowerCase()
  let duration = 3 // default
  let cleanDest = query

  // Match:
  // "X days in [destination]"
  // "in [destination] for X days"
  // "[destination] X days"
  // "[destination] for X days"
  const daysRegexes = [
    /(\d+)\s*days?\s+(?:in|for|at|of)?\s+([a-zA-Z\s,]+)/i,
    /(?:in|for|at|of)?\s+([a-zA-Z\s,]+)\s+(?:for\s+)?(\d+)\s*days?/i,
  ]

  let matched = false
  for (const regex of daysRegexes) {
    const match = query.match(regex)
    if (match) {
      if (regex === daysRegexes[0]) {
        duration = parseInt(match[1])
        cleanDest = match[2]
      } else {
        cleanDest = match[1]
        duration = parseInt(match[2])
      }
      matched = true
      break
    }
  }

  // Fallback: If no regex matches but there is a number in the string
  if (!matched) {
    const numMatch = query.match(/\b(\d+)\b/)
    if (numMatch) {
      duration = parseInt(numMatch[1])
      // Remove the number and terms like "days" from destination
      cleanDest = query
        .replace(/\b\d+\b/g, "")
        .replace(/\bdays?\b/gi, "")
        .replace(/\bfor\b/gi, "")
        .trim()
    }
  }

  // Bound duration between 1 and 14 days to prevent abuse or payload truncation
  duration = Math.max(1, Math.min(14, duration))
  
  // Clean up destination text
  cleanDest = cleanDest.replace(/\s+/g, " ").trim()
  // Strip leading/trailing punctuation/commas
  cleanDest = cleanDest.replace(/^[,\-\s]+|[,\-\s]+$/g, "")

  if (!cleanDest) {
    cleanDest = query
  }

  return { cleanDest, duration }
}

// ─── Dynamic Procedural Multi-day Itinerary Generator ────────────────────────

function generateProceduralItinerary(dest: string, duration: number) {
  const capitalizedDest = dest.charAt(0).toUpperCase() + dest.slice(1)

  // Procedural thematic template array
  const DAY_THEME_TEMPLATES = [
    {
      title: "Immersion & Core Landmarks",
      desc: `Discovering iconic architectural sights, monumental galleries, and landmark squares in ${capitalizedDest}.`,
      activities: [
        {
          time: "Morning",
          spot: `${capitalizedDest} Historic Center`,
          desc: `Stroll through the monumental central square of ${capitalizedDest}, admiring its classical structures and vibrant street life.`,
          tips: "Walk early at sunrise to capture the golden sunbeams hitting the stone structures without tourist crowds.",
          attire: "Comfortable hiking shoes or walking sneakers & light layered clothing.",
          duration: "1.5 — 2 Hours",
          cost: "Free"
        },
        {
          time: "Afternoon",
          spot: `${capitalizedDest} Heritage Museum`,
          desc: `Explore detailed historical maps, archives, and regional paintings tracing the roots of ${capitalizedDest}.`,
          tips: "Ask for the complimentary audio guide booklet at the reception desk—it contains fascinating local history anecdotes.",
          attire: "Smart casual with comfortable socks, as some special exhibition corridors require removing footwear.",
          duration: "2 — 2.5 Hours",
          cost: "$12 USD"
        },
        {
          time: "Evening",
          spot: `${capitalizedDest} Waterfront Walk`,
          desc: `Enjoy a quiet sunset walk along the illuminated brick pathways and canals as city lights begin to reflect.`,
          tips: "The third terrace of the stone bridge near the south corner offers the single best sunset panorama in the area.",
          attire: "Casual attire with a warm light jacket or sweater, as the evening harbor breeze can get quite chilly.",
          duration: "2 Hours",
          cost: "Free"
        }
      ]
    },
    {
      title: "Boutique Alleys & Traditional Crafts",
      desc: `Stepping off the beaten path to explore hidden pathways, craft workshops, and local studios inside ${capitalizedDest}.`,
      activities: [
        {
          time: "Morning",
          spot: `${capitalizedDest} Craft Atelier`,
          desc: `Observe weavers, pottery artisans, and woodcarvers keeping historic local manufacturing techniques alive.`,
          tips: "The master potter, Kenji, allows visitors to try throwing clay on the traditional kick-wheel for a small donation.",
          attire: "Durable casual wear that you don't mind getting slightly dusty or splashed with clay.",
          duration: "2 Hours",
          cost: "Free (Donation suggested)"
        },
        {
          time: "Afternoon",
          spot: "Hidden Courtyard Sanctuary",
          desc: "Relax inside a quiet stone walled botanical garden featuring cascading fountains and quiet reading benches.",
          tips: "Enter through the unmarked heavy iron gate behind the main shrine block—it appears locked, but is fully open to visitors.",
          attire: "Breathable linen clothing and protective sun hat.",
          duration: "1.5 Hours",
          cost: "Free"
        },
        {
          time: "Evening",
          spot: "Traditional Food Tasting Cellar",
          desc: "Dine inside a cozy brick-lined neighborhood kitchen, tasting local recipes accompanied by acoustic sounds.",
          tips: "Order the signature claypot rice dish; it's slow-cooked for 40 minutes over hot coals and is absolutely worth the wait.",
          attire: "Smart casual outfit.",
          duration: "2.5 Hours",
          cost: "$25 — $40 USD"
        }
      ]
    },
    {
      title: "Nature Trails & Panoramic Vistas",
      desc: "Reconnecting with nature along lush valleys, mountain walking paths, or coastal view cliffs.",
      activities: [
        {
          time: "Morning",
          spot: `${capitalizedDest} Forest Ridge Path`,
          desc: "An refreshing morning trek through old-growth woodlands, breathing fresh, pine-infused mountain oxygen.",
          tips: "Keep your camera ready—rare blue-tailed magpies are highly active in the canopy branches around the third mile marker.",
          attire: "Sturdy trail-running shoes or hiking boots with strong ankle support.",
          duration: "3 Hours",
          cost: "Free"
        },
        {
          time: "Afternoon",
          spot: "Secluded Lakeside Pier",
          desc: "Unwind on a rustic wood pier, watching sailboats drift across the horizon while feeling the cool breeze.",
          tips: "The tiny boat rental shack on the west bank offers wooden rowboats for rent; row to the center island for absolute peace.",
          attire: "Quick-drying shorts, sandals, and high-protection water-resistant sunscreen.",
          duration: "2 Hours",
          cost: "$15 USD for boat rental"
        },
        {
          time: "Evening",
          spot: "Sunset Observatory Summit",
          desc: `Ascend to the highest lookout summit to watch the orange sky turn deep indigo over ${capitalizedDest}.`,
          tips: "Take the cable car up, but walk the wooden forest stairway down—it is beautifully illuminated by soft bamboo lamps.",
          attire: "Windbreaker or fleece jacket, as temperatures drop rapidly once the sun sets below the peaks.",
          duration: "2 Hours",
          cost: "$8 USD for cable car"
        }
      ]
    },
    {
      title: "Gastronomy & Local Dining Secrets",
      desc: `Discovering the unique flavors, fresh street markets, and culinary traditions of ${capitalizedDest}.`,
      activities: [
        {
          time: "Morning",
          spot: `${capitalizedDest} Organic Farmers Market`,
          desc: "Sample fresh native fruits, artisanal cheeses, and warm honey baked pastries straight from local farms.",
          tips: "Stop by the corner bakery stall, 'Old Mill Oven', and purchase a warm cardamom sourdough roll—it sells out by 10 AM.",
          attire: "Casual street-wear and comfortable walking flats.",
          duration: "2 Hours",
          cost: "Varies based on appetite ($10 - $20 USD)"
        },
        {
          time: "Afternoon",
          spot: "Traditional Culinary Workshop",
          desc: `Join a local culinary specialist to learn how to mix native spices and prepare a classic ${capitalizedDest} dish.`,
          tips: "Take notes on the chef's spice ratio charts; they are ancient family secrets passed down through generations.",
          attire: "An apron is provided, but wear short sleeves or clothes that roll up easily.",
          duration: "3 Hours",
          cost: "$50 USD (Includes full lunch)"
        },
        {
          time: "Evening",
          spot: "Bustling Lantern-Lit Street Alley",
          desc: "Navigate a lively evening street bazaar, sampling hot skewers, sweet pasties, and botanical tea blends.",
          tips: "Look for the stall with the longest queue of local residents—their grilled charcoal skewers are legendary.",
          attire: "Casual outfit and thick-soled shoes, as the stones can be crowded and uneven.",
          duration: "2.5 Hours",
          cost: "$15 — $25 USD"
        }
      ]
    },
    {
      title: "Architectural Marvels & Contemporary Lines",
      desc: `Admiring modern design trends, futuristic glass galleries, and stylish shopping quarters in ${capitalizedDest}.`,
      activities: [
        {
          time: "Morning",
          spot: `${capitalizedDest} Contemporary Art District`,
          desc: "Explore sleek concrete and glass warehouses displaying innovative interactive modern installations.",
          tips: "The basement mirror maze gallery on level B2 is highly photogenic and practically empty before mid-day.",
          attire: "Creative or stylish smart casual outfit.",
          duration: "2 Hours",
          cost: "$15 USD"
        },
        {
          time: "Afternoon",
          spot: "Elevated Skyline Skydeck",
          desc: "Ride a high-speed glass elevator to a sky-high observation lounge offering 360 panoramic city views.",
          tips: "Stand in the glass floor 'overhang' pod on the north wing for an adrenaline-fueled look straight down to the streets.",
          attire: "Stylish casual wear.",
          duration: "1.5 Hours",
          cost: "$22 USD"
        },
        {
          time: "Evening",
          spot: "Cybernetic Light Display Park",
          desc: "Watch a beautifully choreographed laser, mist, and sound performance in the main modern plaza.",
          tips: "For the absolute best vantage, sit on the steps of the municipal library opposite the fountain array.",
          attire: "Casual clothes with a cozy scarf or jacket for outdoor sitting.",
          duration: "1.5 Hours",
          cost: "Free"
        }
      ]
    },
    {
      title: "Sacred Grounds & Zen Retreats",
      desc: "Finding peaceful sanctuaries, stone rock gardens, and classic meditation yards.",
      activities: [
        {
          time: "Morning",
          spot: `${capitalizedDest} Zen Rock Garden`,
          desc: "Walk through mossy paths and ancient stone archways before crowds arrive, absorbing the morning quiet.",
          tips: "The 15 gravel ripples are arranged so that at least one rock is always hidden from sight, representing the limits of human knowledge.",
          attire: "Comfortable, modest clothing with neat socks (shoes must be left on the temple entrance shelf).",
          duration: "2 Hours",
          cost: "$5 USD"
        },
        {
          time: "Afternoon",
          spot: "Tranquil Tea House Pavilion",
          desc: "Relax by beautifully raked gravel patterns reflecting classical philosophical concepts while enjoying organic tea.",
          tips: "Ask for the special roasted barley and buckwheat tea blend—it is harvested by monks on the sacred southern mountain.",
          attire: "Modest casual wear.",
          duration: "1.5 Hours",
          cost: "$10 USD"
        },
        {
          time: "Evening",
          spot: "Candlelight Evening Ceremony",
          desc: "Observe a quiet chant and lantern-lighting ceremony inside a historic wooden temple sanctuary.",
          tips: "Keep your electronic devices completely silent; photography is strictly prohibited during the active chanting sections.",
          attire: "Modest attire covering shoulders and knees.",
          duration: "1.5 Hours",
          cost: "Free (Donations appreciated)"
        }
      ]
    },
    {
      title: "Coastal Ridges & Maritime Waves",
      desc: "Exploring pristine sandy shores, coastal cliff walkways, and active stone lighthouses.",
      activities: [
        {
          time: "Morning",
          spot: `${capitalizedDest} Coastal Crescent Beach`,
          desc: "Listen to the rhythmic breaking waves while walking along a pristine crescent-shaped sandy beach.",
          tips: "Explore the rock pools at the northern tip of the cove—they are filled with colorful anemones and purple starfish during low tide.",
          attire: "Beachwear, sunglasses, sandals, and a light cover-up.",
          duration: "2 Hours",
          cost: "Free"
        },
        {
          time: "Afternoon",
          spot: "Cliffside Lighthouse Walkway",
          desc: "Hike along high rocky cliffs leading to an active 19th-century white brick lighthouse.",
          tips: "The lighthouse museum houses the original giant brass Fresnel lens; climb the spiral stairs to see it up close.",
          attire: "Comfortable windbreaker and sturdy hiking shoes with rubber grip.",
          duration: "2 Hours",
          cost: "$3 USD for lighthouse climb"
        },
        {
          time: "Evening",
          spot: "Waterfront Seafood Harbor",
          desc: "Enjoy a fresh seafood dinner on a deck directly over the water, watching the harbor lights flicker.",
          tips: "Request a table on the outer pier deck; you'll be able to watch fishing trawlers unloading their evening catches directly.",
          attire: "Smart casual clothing with a warm sweater.",
          duration: "2.5 Hours",
          cost: "$30 — $50 USD"
        }
      ]
    },
    {
      title: "Classical Sounds & Creative Curations",
      desc: "Immersing in world-class art collections, opera halls, and theater libraries.",
      activities: [
        {
          time: "Morning",
          spot: `${capitalizedDest} Fine Arts Academy`,
          desc: "View classic and modern paintings and sculptures created by regional design legends.",
          tips: "The gallery on the fourth wing features stunning skylights that illuminate the marble sculptures with warm natural light.",
          attire: "Polished casual outfit.",
          duration: "2.5 Hours",
          cost: "$10 USD"
        },
        {
          time: "Afternoon",
          spot: "Bespoke Antique Marketplace",
          desc: "Browse crowded stalls filled with vintage travel books, old hand-drawn maps, and historic collectibles.",
          tips: "The dealer in stall #12 has an amazing collection of century-old local postcards—they make incredibly unique travel souvenirs.",
          attire: "Casual street attire.",
          duration: "2 Hours",
          cost: "Free to browse"
        },
        {
          time: "Evening",
          spot: "Classical Concert Hall",
          desc: "Attend a live evening performance of classical string instruments in an acoustically rich dome hall.",
          tips: "Arrive at least 20 minutes before the doors close; latecomers are not admitted until the first intermission.",
          attire: "Semi-formal or elegant smart outfit.",
          duration: "2.5 Hours",
          cost: "$45 USD"
        }
      ]
    },
    {
      title: "Countryside Escapes & Small Villages",
      desc: `Venturing just outside the borders of ${capitalizedDest} to see organic farms and quiet villages.`,
      activities: [
        {
          time: "Morning",
          spot: "Scenic Country Train",
          desc: "Board a vintage wooden train passing through rolling green hills and deep agricultural valleys.",
          tips: "Sit on the left-hand side of the carriage for the best views of the towering stone aqueduct at the midway point.",
          attire: "Comfortable country wear and walking boots.",
          duration: "2 Hours",
          cost: "$18 USD round trip"
        },
        {
          time: "Afternoon",
          spot: "Boutique Country Orchard",
          desc: "Harvest fresh seasonal berries or olives, enjoying a picnic underneath the shade of olive trees.",
          tips: "The orchard shop blends organic wild lavender honey with olive oil—it is absolute nectar.",
          attire: "Sunhat, comfortable clothes, and flat shoes.",
          duration: "2.5 Hours",
          cost: "$12 USD (Includes fruit basket)"
        },
        {
          time: "Evening",
          spot: "Rustic Farmhouse Tavern",
          desc: "Dine on hearty farm-to-table dishes prepared with ingredients harvested from the surrounding fields.",
          tips: "Order the daily roast special; it's slow-cooked for 6 hours in a brick wood-fire oven and served with fresh herbs.",
          attire: "Casual warm clothes.",
          duration: "2 Hours",
          cost: "$20 — $35 USD"
        }
      ]
    },
    {
      title: "Spa Wellness & Thermal Caverns",
      desc: "A slowly paced day designed for ultimate physical relaxation and mental wellness.",
      activities: [
        {
          time: "Morning",
          spot: "Mineral Thermal Springs",
          desc: "Soak in hot, mineral-rich thermal pools nestled inside stone caverns.",
          tips: "The steam cavern near the back has the highest mineral concentration and is exceptionally soothing for muscle fatigue.",
          attire: "Swimwear (towels and bathrobes are provided by the reception desk).",
          duration: "3 Hours",
          cost: "$35 USD"
        },
        {
          time: "Afternoon",
          spot: "Aromatic Tea Garden",
          desc: "Sip soothing herbal infusions while listening to wind chimes and natural streams.",
          tips: "Try the lavender and organic chamomile herbal tea blend; it is harvested on the sacred southern mountain slopes.",
          attire: "Comfortable linen wear.",
          duration: "1.5 Hours",
          cost: "$8 USD"
        },
        {
          time: "Evening",
          spot: "Sunset Yoga Platform",
          desc: "Align your posture and breathing during a peaceful outdoor yoga session as the sky changes colors.",
          tips: "No prior experience is necessary; the instructor, Sarah, tailors the movements perfectly for travel stretching.",
          attire: "Stretchy athletic wear or flexible linen clothing.",
          duration: "1.5 Hours",
          cost: "$15 USD"
        }
      ]
    },
    {
      title: "Historic Fortresses & Castle Gates",
      desc: "Discovering medieval defense battlements, castles, and high stone walls.",
      activities: [
        {
          time: "Morning",
          spot: "Grand Castle Drawbridge",
          desc: "Cross the drawbridge of a grand medieval fortress overlooking the valley.",
          tips: "Visit the armory hall on the east wing first; they display fully intact chainmail suits and dynamic longbow gear.",
          attire: "Comfortable hiking boots or walking shoes.",
          duration: "2.5 Hours",
          cost: "$10 USD"
        },
        {
          time: "Afternoon",
          spot: "Stone Rampart Walkway",
          desc: "Walk along the high fortress walls, viewing historic cannons and arrow slots.",
          tips: "The corner watchtower near the west rampart provides unparalleled panoramic views of the entire valley basin.",
          attire: "Hat, sunglasses, and high UV protection sunscreen.",
          duration: "2 Hours",
          cost: "Free (Included in morning pass)"
        },
        {
          time: "Evening",
          spot: "Castle Cellar Dining Room",
          desc: "Feast on roasted delicacies inside a stone-vaulted dining room lit by firelight.",
          tips: "Order the slow-roasted lamb shoulder; it is spiced with forest herbs and served in traditional iron cauldrons.",
          attire: "Smart casual outfit.",
          duration: "2.5 Hours",
          cost: "$30 — $50 USD"
        }
      ]
    },
    {
      title: "Botanical Wonders & Rose Mazes",
      desc: "Exploring massive glass biomes, rose mazes, and manicured botanic displays.",
      activities: [
        {
          time: "Morning",
          spot: "Manicured Botanic Maze",
          desc: "Stroll through a blooming rose maze and past massive water lily ponds.",
          tips: "The center of the rose maze features a lovely sun dial; try to locate it without looking at the map charts.",
          attire: "Casual clothing and walking shoes.",
          duration: "2 Hours",
          cost: "$6 USD"
        },
        {
          time: "Afternoon",
          spot: "Tropical Forest Greenhouse",
          desc: "Step inside a massive glass dome housing dense tropical vines and indoor waterfalls.",
          tips: "Cross the wooden suspended bridge at the upper level; you'll be walking directly through the mist of the waterfall canopy.",
          attire: "Light clothing, as the biome interior is kept warm and highly humid.",
          duration: "2 Hours",
          cost: "Free (Included in botanic pass)"
        },
        {
          time: "Evening",
          spot: "Orchid Greenhouse Cafe",
          desc: "Enjoy organic pastries surrounded by hundreds of colorful blooming orchids.",
          tips: "Order the signature jasmine-infused green tea cake; it is topped with edible candied orchid petals.",
          attire: "Casual smart dress.",
          duration: "1.5 Hours",
          cost: "$12 USD"
        }
      ]
    },
    {
      title: "Active Adventures & Redwood Valleys",
      desc: "Getting your pulse racing with trail cycling, river paddling, or rock climbing.",
      activities: [
        {
          time: "Morning",
          spot: "Redwood Trail Biking",
          desc: "Rent a trail bike and zip along winding dirt pathways through redwood forests.",
          tips: "The forest trail near the blue creek bed is exceptionally flat and offers amazing views of ancient redwood rings.",
          attire: "Closed-toe athletic shoes and flexible activewear.",
          duration: "2.5 Hours",
          cost: "$20 USD for bike rental"
        },
        {
          time: "Afternoon",
          spot: "Turquoise River Kayaking",
          desc: "Paddle a sleek kayak along a calm turquoise river winding through steep gorges.",
          tips: "The local guides run a brief paddling orientation at 1 PM; attend it to learn about the safety channels along the river.",
          attire: "Swimwear or quick-drying activewear, water sandals, and water-resistant drybag.",
          duration: "2.5 Hours",
          cost: "$30 USD for kayak rental"
        },
        {
          time: "Evening",
          spot: "Basecamp Outdoor Fire pit",
          desc: "Roast marshmallows and swap travel stories around a large outdoor stone fire pit.",
          tips: "Ask the campground host, Bob, for his legendary cherrywood fire logs—they release an outstanding forest aroma.",
          attire: "Warm fleece jacket, long pants, and socks to keep mosquitoes away.",
          duration: "2 Hours",
          cost: "Free"
        }
      ]
    },
    {
      title: "Lifestyle Districts & Fashion Lanes",
      desc: "Exploring trendy quarters, boutique shopping lanes, and modern lifestyle hubs.",
      activities: [
        {
          time: "Morning",
          spot: "Hip Design Quarter",
          desc: "Browse high-end streetwear, local fashion boutiques, and modern art stores.",
          tips: "Several designers run tiny showroom shops in the second floor lofts; look for the elegant hanging sign boards.",
          attire: "Trendy, creative casual wear.",
          duration: "2.5 Hours",
          cost: "Free to browse"
        },
        {
          time: "Afternoon",
          spot: "Indie Coffee Roasters",
          desc: "Taste single-origin cold brews inside a converted industrial warehouse.",
          tips: "Order a flight of cold brew tasters—it showcases three completely different regional roasting styles.",
          attire: "Smart casual wear.",
          duration: "1.5 Hours",
          cost: "$8 USD"
        },
        {
          time: "Evening",
          spot: "Trendy Rooftop Terrace",
          desc: "Mix with fashionable locals enjoying craft mocktails looking over neon billboards.",
          tips: "Reserve a fireside lounge table on the south corner; it offers an incredibly clear view of the city neon grids.",
          attire: "Dressy or stylish smart casual attire.",
          duration: "2.5 Hours",
          cost: "$20 — $40 USD"
        }
      ]
    },
    {
      title: "Farewell Skyline Gala",
      desc: `Celebrating your final night in ${capitalizedDest} with the absolute best culinary and visual experiences.`,
      activities: [
        {
          time: "Morning",
          spot: "Handicraft Souvenir Shop",
          desc: "Purchase handcrafted collectibles and custom tea blends to take back home.",
          tips: "The shopkeeper offers elegant wooden box gift-wrapping using traditional botanical leaf ribbons—highly recommended.",
          attire: "Casual outfit.",
          duration: "1.5 Hours",
          cost: "Varies"
        },
        {
          time: "Afternoon",
          spot: "Sunset Hillside Meadow",
          desc: "Relax on a grassy hillside, looking back over the entire city landscape we explored.",
          tips: "Bring a light cotton picnic sheet; lying under the ancient oak canopy overlooking the streets is magical.",
          attire: "Casual lightweight clothing and slip-on shoes.",
          duration: "2 Hours",
          cost: "Free"
        },
        {
          time: "Evening",
          spot: "Elevated Chef's Table",
          desc: "A spectacular multi-course tasting menu paired with regional drinks, looking over the glowing grid of the city.",
          tips: "The window booths facing the glowing harbor must be booked weeks in advance—they are the premier culinary seats in town.",
          attire: "Formal or elegant high-end evening wear.",
          duration: "3 Hours",
          cost: "$80 — $120 USD"
        }
      ]
    }
  ]

  // Construct requested days procedurally from templates
  const days: any[] = []
  for (let i = 1; i <= duration; i++) {
    // Wrap around templates if duration > templates length
    const templateIndex = (i - 1) % DAY_THEME_TEMPLATES.length
    const template = DAY_THEME_TEMPLATES[templateIndex]

    // If it's the final day requested, force the Farewell theme for the final day!
    const isFinalDay = i === duration
    const finalTemplate = DAY_THEME_TEMPLATES[DAY_THEME_TEMPLATES.length - 1]
    const activeTemplate = isFinalDay ? finalTemplate : template

    days.push({
      num: i,
      title: activeTemplate.title,
      description: activeTemplate.desc,
      activities: activeTemplate.activities
    })
  }

  // Construct unique stays tailored to destination
  const stays: any[] = [
    {
      name: `The Grand ${capitalizedDest} Palace`,
      vibe: "Historic Aristocratic Luxury",
      price: "₹18,000 / Night",
      desc: `A beautifully restored 19th-century estate featuring classical chandeliers, silk wall-drapes, and a private courtyard.`,
      emoji: "🏨"
    },
    {
      name: `${capitalizedDest} Forest Eco-Sanctuary`,
      vibe: "Boutique Biophilic Wellness",
      price: "₹12,000 / Night",
      desc: `Nestled in a private woodland reserve, built entirely from organic local timber with open air terraces and sunrise meditation decks.`,
      emoji: "🌿"
    },
    {
      name: `The Glasshouse Lofts ${capitalizedDest}`,
      vibe: "Minimalist High-Tech Penthouse",
      price: "₹6,500 / Night",
      desc: `High-rise suites featuring floor-to-ceiling glass screens, integrated smart lighting panels, and outdoor hot tubs looking over the horizon.`,
      emoji: "🏙️"
    }
  ]

  // Construct unique dining options
  const food: any[] = [
    {
      dish: `Traditional ${capitalizedDest} Feast`,
      restaurant: "The Heritage Kitchen",
      desc: "Slow-roasted organic ingredients combined with native spices, cooked according to a century-old secret recipe.",
      priceRange: "₹1,500 — ₹3,000 for two",
      emoji: "🍽️"
    },
    {
      dish: "Fusion Waterfront Skewers",
      restaurant: "Sunset Wharf Bazaar",
      desc: "Freshly prepared ingredients grilled over custom charcoal fire boxes and drizzled with a sweet citrus honey glaze.",
      priceRange: "₹350 — ₹800 for two",
      emoji: "🥞"
    },
    {
      dish: `Signature Botanical Torte`,
      restaurant: "Sweet Bloom Patisserie",
      desc: "A light, fluffy cake infused with local herbal teas and rosewater, topped with a glass sugar lattice work.",
      priceRange: "₹600 — ₹1,200 for two",
      emoji: "🍰"
    }
  ]

  // Insiders tips
  const tips: string[] = [
    `Pick up an official ${capitalizedDest} unlimited Transit Card at the arrival terminal for seamless train and bus travel.`,
    "Local custom highly values quiet tones on public transit and inside sacred historic corridors—avoid speaking loudly.",
    "Carry some local physical cash, as boutique merchants and street food stalls often do not support card transactions.",
    "Wear high-quality walking shoes with thick arch support—the absolute best parts of this city are discovered on foot."
  ]

  return {
    destination: `${capitalizedDest} - ${duration} Day Blueprint`,
    days,
    stays,
    food,
    tips
  }
}
