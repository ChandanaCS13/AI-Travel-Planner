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

    // Read API key from custom header or server environment variables
    const apiKey = req.headers.get("x-api-key") || process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY

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
          "desc": "A compelling description of what to do, what to look for, and the vibe."
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

Please provide EXACTLY ${duration} distinct days (from Day 1 to Day ${duration}) with 3 structured activities per day, 3 stay recommendations, 3 dining recommendations, and 4 insightful local tips.`

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
        { time: "Morning", spot: `${capitalizedDest} Historic Center`, desc: `Stroll through the monumental central square of ${capitalizedDest}, admiring its classical structures and vibrant street life.` },
        { time: "Afternoon", spot: `${capitalizedDest} Heritage Museum`, desc: `Explore detailed historical maps, archives, and regional paintings tracing the roots of ${capitalizedDest}.` },
        { time: "Evening", spot: `${capitalizedDest} Waterfront Walk`, desc: `Enjoy a quiet sunset walk along the illuminated brick pathways and canals as city lights begin to reflect.` }
      ]
    },
    {
      title: "Boutique Alleys & Traditional Crafts",
      desc: `Stepping off the beaten path to explore hidden pathways, craft workshops, and local studios inside ${capitalizedDest}.`,
      activities: [
        { time: "Morning", spot: `${capitalizedDest} Craft Atelier`, desc: `Observe weavers, pottery artisans, and woodcarvers keeping historic local manufacturing techniques alive.` },
        { time: "Afternoon", spot: "Hidden Courtyard Sanctuary", desc: "Relax inside a quiet stone walled botanical garden featuring cascading fountains and quiet reading benches." },
        { time: "Evening", spot: "Traditional Food Tasting Cellar", desc: "Dine inside a cozy brick-lined neighborhood kitchen, tasting local recipes accompanied by acoustic sounds." }
      ]
    },
    {
      title: "Nature Trails & Panoramic Ridges",
      desc: "Reconnecting with nature along lush valleys, mountain walking paths, or coastal view cliffs.",
      activities: [
        { time: "Morning", spot: `${capitalizedDest} Forest Ridge Path`, desc: "An refreshing morning trek through old-growth woodlands, breathing fresh, pine-infused mountain oxygen." },
        { time: "Afternoon", spot: "Secluded Lakeside Pier", desc: "Unwind on a rustic wood pier, watching sailboats drift across the horizon while feeling the cool breeze." },
        { time: "Evening", spot: "Sunset Observatory Summit", desc: `Ascend to the highest lookout summit to watch the orange sky turn deep indigo over ${capitalizedDest}.` }
      ]
    },
    {
      title: "Gastronomy & Local Dining Secrets",
      desc: `Discovering the unique flavors, fresh street markets, and culinary traditions of ${capitalizedDest}.`,
      activities: [
        { time: "Morning", spot: `${capitalizedDest} Organic Farmers Market`, desc: "Sample fresh native fruits, artisanal cheeses, and warm honey baked pastries straight from local farms." },
        { time: "Afternoon", spot: "Traditional Culinary Workshop", desc: `Join a local culinary specialist to learn how to mix native spices and prepare a classic ${capitalizedDest} dish.` },
        { time: "Evening", spot: "Bustling Lantern-Lit Street Alley", desc: "Navigate a lively evening street bazaar, sampling hot skewers, sweet pasties, and botanical tea blends." }
      ]
    },
    {
      title: "Architectural Marvels & Contemporary Lines",
      desc: `Admiring modern design trends, futuristic glass galleries, and stylish shopping quarters in ${capitalizedDest}.`,
      activities: [
        { time: "Morning", spot: `${capitalizedDest} Contemporary Art District`, desc: "Explore sleek concrete and glass warehouses displaying innovative interactive modern installations." },
        { time: "Afternoon", spot: "Elevated Skyline Skydeck", desc: "Ride a high-speed glass elevator to a sky-high observation lounge offering 360 panoramic city views." },
        { time: "Evening", spot: "Cybernetic Light Display Park", desc: "Watch a beautifully choreographed laser, mist, and sound performance in the main modern plaza." }
      ]
    },
    {
      title: "Sacred Grounds & Zen Retreats",
      desc: "Finding peaceful sanctuaries, stone rock gardens, and classic meditation yards.",
      activities: [
        { time: "Morning", spot: `${capitalizedDest} Zen Rock Garden`, desc: "Walk through mossy paths and ancient stone archways before crowds arrive, absorbing the morning quiet." },
        { time: "Afternoon", spot: "Tranquil Tea House Pavilion", desc: "Relax by beautifully raked gravel patterns reflecting classical philosophical concepts while enjoying organic tea." },
        { time: "Evening", spot: "Candlelight Evening Ceremony", desc: "Observe a quiet chant and lantern-lighting ceremony inside a historic wooden temple sanctuary." }
      ]
    },
    {
      title: "Coastal Ridges & Maritime Waves",
      desc: "Exploring pristine sandy shores, coastal cliff walkways, and active stone lighthouses.",
      activities: [
        { time: "Morning", spot: `${capitalizedDest} Coastal Crescent Beach`, desc: "Listen to the rhythmic breaking waves while walking along a pristine crescent-shaped sandy beach." },
        { time: "Afternoon", spot: "Cliffside Lighthouse Walkway", desc: "Hike along high rocky cliffs leading to an active 19th-century white brick lighthouse." },
        { time: "Evening", spot: "Waterfront Seafood Harbor", desc: "Enjoy a fresh seafood dinner on a deck directly over the water, watching the harbor lights flicker." }
      ]
    },
    {
      title: "Classical Sounds & Creative Curations",
      desc: "Immersing in world-class art collections, opera halls, and theater libraries.",
      activities: [
        { time: "Morning", spot: `${capitalizedDest} Fine Arts Academy`, desc: "View classic and modern paintings and sculptures created by regional design legends." },
        { time: "Afternoon", spot: "Bespoke Antique Marketplace", desc: "Browse crowded stalls filled with vintage travel books, old hand-drawn maps, and historic collectibles." },
        { time: "Evening", spot: "Classical Concert Hall", desc: "Attend a live evening performance of classical string instruments in an acoustically rich dome hall." }
      ]
    },
    {
      title: "Countryside Escapes & Small Villages",
      desc: `Venturing just outside the borders of ${capitalizedDest} to see organic farms and quiet villages.`,
      activities: [
        { time: "Morning", spot: "Scenic Country Train", desc: "Board a vintage wooden train passing through rolling green hills and deep agricultural valleys." },
        { time: "Afternoon", spot: "Boutique Country Orchard", desc: "Harvest fresh seasonal berries or olives, enjoying a picnic underneath the shade of olive trees." },
        { time: "Evening", spot: "Rustic Farmhouse Tavern", desc: "Dine on hearty farm-to-table dishes prepared with ingredients harvested from the surrounding fields." }
      ]
    },
    {
      title: "Spa Wellness & Thermal Caverns",
      desc: "A slowly paced day designed for ultimate physical relaxation and mental wellness.",
      activities: [
        { time: "Morning", spot: "Mineral Thermal Springs", desc: "Soak in hot, mineral-rich thermal pools nestled inside stone caverns." },
        { time: "Afternoon", spot: "Aromatic Tea Garden", desc: "Sip soothing herbal infusions while listening to wind chimes and natural streams." },
        { time: "Evening", spot: "Sunset Yoga Platform", desc: "Align your posture and breathing during a peaceful outdoor yoga session as the sky changes colors." }
      ]
    },
    {
      title: "Historic Fortresses & Castle Gates",
      desc: "Discovering medieval defense battlements, castles, and high stone walls.",
      activities: [
        { time: "Morning", spot: "Grand Castle Drawbridge", desc: "Cross the drawbridge of a grand medieval fortress overlooking the valley." },
        { time: "Afternoon", spot: "Stone Rampart Walkway", desc: "Walk along the high fortress walls, viewing historic cannons and arrow slots." },
        { time: "Evening", spot: "Castle Cellar Dining Room", desc: "Feast on roasted delicacies inside a stone-vaulted dining room lit by firelight." }
      ]
    },
    {
      title: "Botanical Wonders & Rose Mazes",
      desc: "Exploring massive glass biomes, rose mazes, and manicured botanic displays.",
      activities: [
        { time: "Morning", spot: "Manicured Botanic Maze", desc: "Stroll through a blooming rose maze and past massive water lily ponds." },
        { time: "Afternoon", spot: "Tropical Forest Greenhouse", desc: "Step inside a massive glass dome housing dense tropical vines and indoor waterfalls." },
        { time: "Evening", spot: "Orchid Greenhouse Cafe", desc: "Enjoy organic pastries surrounded by hundreds of colorful blooming orchids." }
      ]
    },
    {
      title: "Active Adventures & Redwood Valleys",
      desc: "Getting your pulse racing with trail cycling, river paddling, or rock climbing.",
      activities: [
        { time: "Morning", spot: "Redwood Trail Biking", desc: "Rent a trail bike and zip along winding dirt pathways through redwood forests." },
        { time: "Afternoon", spot: "Turquoise River Kayaking", desc: "Paddle a sleek kayak along a calm turquoise river winding through steep gorges." },
        { time: "Evening", spot: "Basecamp Outdoor Fire pit", desc: "Roast marshmallows and swap travel stories around a large outdoor stone fire pit." }
      ]
    },
    {
      title: "Lifestyle Districts & Fashion Lanes",
      desc: "Exploring trendy quarters, boutique shopping lanes, and modern lifestyle hubs.",
      activities: [
        { time: "Morning", spot: "Hip Design Quarter", desc: "Browse high-end streetwear, local fashion boutiques, and modern art stores." },
        { time: "Afternoon", spot: "Indie Coffee Roasters", desc: "Taste single-origin cold brews inside a converted industrial warehouse." },
        { time: "Evening", spot: "Trendy Rooftop Terrace", desc: "Mix with fashionable locals enjoying craft mocktails looking over neon billboards." }
      ]
    },
    {
      title: "Farewell Skyline Gala",
      desc: `Celebrating your final night in ${capitalizedDest} with the absolute best culinary and visual experiences.`,
      activities: [
        { time: "Morning", spot: "Handicraft Souvenir Shop", desc: "Purchase handcrafted collectibles and custom tea blends to take back home." },
        { time: "Afternoon", spot: "Sunset Hillside Meadow", desc: "Relax on a grassy hillside, looking back over the entire city landscape we explored." },
        { time: "Evening", spot: "Elevated Chef's Table", desc: "A spectacular multi-course tasting menu paired with regional drinks, looking over the glowing grid of the city." }
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
      price: "$$$$ / Night",
      desc: `A beautifully restored 19th-century estate featuring classical chandeliers, silk wall-drapes, and a private courtyard.`,
      emoji: "🏨"
    },
    {
      name: `${capitalizedDest} Forest Eco-Sanctuary`,
      vibe: "Boutique Biophilic Wellness",
      price: "$$$ / Night",
      desc: `Nestled in a private woodland reserve, built entirely from organic local timber with open air terraces and sunrise meditation decks.`,
      emoji: "🌿"
    },
    {
      name: `The Glasshouse Lofts ${capitalizedDest}`,
      vibe: "Minimalist High-Tech Penthouse",
      price: "$$ / Night",
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
      priceRange: "$$$",
      emoji: "🍽️"
    },
    {
      dish: "Fusion Waterfront Skewers",
      restaurant: "Sunset Wharf Bazaar",
      desc: "Freshly prepared ingredients grilled over custom charcoal fire boxes and drizzled with a sweet citrus honey glaze.",
      priceRange: "$",
      emoji: "🥞"
    },
    {
      dish: `Signature Botanical Torte`,
      restaurant: "Sweet Bloom Patisserie",
      desc: "A light, fluffy cake infused with local herbal teas and rosewater, topped with a crisp sugar lattice work.",
      priceRange: "$$",
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
