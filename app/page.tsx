"use client"

import React, { useState, useEffect, useRef, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import AeroVibeHero from "@/components/AeroVibeHero"

// ─── Shared Background Components for Continuity ─────────────────────────────

interface StarData {
  id: number
  x: number
  y: number
  size: number
  baseX: number
  baseY: number
  delay: number
  duration: number
  opacity: number
}

const STAR_COUNT = 120

function generateStars(): StarData[] {
  return Array.from({ length: STAR_COUNT }, (_, i) => {
    const x = Math.random() * 100
    const y = Math.random() * 100
    return {
      id:       i,
      x,
      y,
      baseX:    x,
      baseY:    y,
      size:     Math.random() * 2.5 + 0.5,
      delay:    Math.random() * 5,
      duration: 2 + Math.random() * 4,
      opacity:  0.3 + Math.random() * 0.7,
    }
  })
}

function StarField() {
  const canvasRef  = useRef<HTMLCanvasElement>(null)
  const starsRef   = useRef<StarData[]>(generateStars())
  const mouseRef   = useRef({ x: -9999, y: -9999 })
  const rafRef     = useRef<number>(0)
  const timeRef    = useRef(0)

  const handleMouseMove = useCallback((e: MouseEvent) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    mouseRef.current = {
      x: ((e.clientX - rect.left) / rect.width)  * 100,
      y: ((e.clientY - rect.top)  / rect.height) * 100,
    }
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const resize = () => {
      canvas.width  = canvas.offsetWidth  * window.devicePixelRatio
      canvas.height = canvas.offsetHeight * window.devicePixelRatio
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio)
    }
    resize()
    window.addEventListener("resize", resize)
    window.addEventListener("mousemove", handleMouseMove)

    const draw = (timestamp: number) => {
      const dt = timestamp - timeRef.current
      timeRef.current = timestamp

      const w = canvas.offsetWidth
      const h = canvas.offsetHeight

      ctx.clearRect(0, 0, w, h)

      const mx = mouseRef.current.x
      const my = mouseRef.current.y
      const INFLUENCE = 12
      const RADIUS    = 18

      starsRef.current.forEach((star) => {
        const dx   = mx - star.baseX
        const dy   = my - star.baseY
        const dist = Math.sqrt(dx * dx + dy * dy)

        if (dist < RADIUS && dist > 0.1) {
          const force   = (1 - dist / RADIUS) * INFLUENCE
          const targetX = star.baseX + (dx / dist) * force
          const targetY = star.baseY + (dy / dist) * force
          star.x += (targetX - star.x) * 0.08
          star.y += (targetY - star.y) * 0.08
        } else {
          star.x += (star.baseX - star.x) * 0.04
          star.y += (star.baseY - star.y) * 0.04
        }

        const twinkle = 0.5 + 0.5 * Math.sin((timestamp / 1000 + star.delay) * (6.28 / star.duration))
        const alpha   = star.opacity * (0.4 + 0.6 * twinkle)

        const px = (star.x / 100) * w
        const py = (star.y / 100) * h

        if (star.size > 1.8) {
          const grd = ctx.createRadialGradient(px, py, 0, px, py, star.size * 3)
          grd.addColorStop(0, `rgba(200,200,255,${alpha * 0.6})`)
          grd.addColorStop(1, "rgba(200,200,255,0)")
          ctx.beginPath()
          ctx.arc(px, py, star.size * 3, 0, Math.PI * 2)
          ctx.fillStyle = grd
          ctx.fill()
        }

        ctx.beginPath()
        ctx.arc(px, py, star.size / 2, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255,255,255,${alpha})`
        ctx.fill()
      })

      rafRef.current = requestAnimationFrame(draw)
    }

    rafRef.current = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(rafRef.current)
      window.removeEventListener("resize", resize)
      window.removeEventListener("mousemove", handleMouseMove)
    }
  }, [handleMouseMove])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 1 }}
    />
  )
}

function AuroraBlobs() {
  const blobs = [
    { style: { top: "-6rem", left: "-5rem", width: 500, height: 400 }, bg: "radial-gradient(ellipse, #6c2ff7 0%, #3b0fa0 60%, transparent 100%)", anim: { x:[0,30,0], y:[0,40,0], scale:[1,1.15,1] }, dur: 14, delay: 0   },
    { style: { top: "3rem", right: "-6rem", width: 450, height: 350 }, bg: "radial-gradient(ellipse, #0ea5e9 0%, #0369a1 60%, transparent 100%)", anim: { x:[0,-25,0], y:[0,35,0], scale:[1,1.1,1]  }, dur: 11, delay: 4   },
    { style: { bottom: "3rem", left: "20%",  width: 350, height: 300 }, bg: "radial-gradient(ellipse, #ec4899 0%, #9d174d 60%, transparent 100%)", anim: { x:[0,20,0], y:[0,-30,0], scale:[1,1.12,1] }, dur: 16, delay: 8   },
    { style: { bottom: "-4rem", right: "10%", width: 300, height: 250 }, bg: "radial-gradient(ellipse, #10b981 0%, #064e3b 60%, transparent 100%)", anim: { x:[0,-20,0], y:[0,-25,0], scale:[1,1.08,1] }, dur: 13, delay: 2   },
  ]

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
      {blobs.map((b, i) => (
        <motion.div
          key={i}
          animate={b.anim}
          transition={{ duration: b.dur, repeat: Infinity, ease: "easeInOut", delay: b.delay }}
          className="absolute rounded-full"
          style={{
            ...b.style,
            background: b.bg,
            filter: "blur(80px)",
            opacity: 0.45,
            position: "absolute",
          }}
        />
      ))}
    </div>
  )
}

// ─── Interfaces for Itinerary Data ──────────────────────────────────────────

interface Activity {
  time: string
  spot: string
  desc: string
}

interface DayPlan {
  num: number
  title: string
  description: string
  activities: Activity[]
}

interface Stay {
  name: string
  vibe: string
  price: string
  desc: string
  emoji: string
}

interface Food {
  dish: string
  restaurant: string
  desc: string
  priceRange: string
  emoji: string
}

interface ItineraryData {
  destination: string
  days: DayPlan[]
  stays: Stay[]
  food: Food[]
  tips: string[]
  isDemo?: boolean
}

// ─── Loading Phrases ──────────────────────────────────────────────────────────

const LOADING_PHRASES = [
  "📡 Syncing AI coordinates with local maps...",
  "✈️ Charting optimal transit vectors...",
  "🏨 Curating boutique stays & premium lodgings...",
  "🍜 Exploring local secrets & culinary specialties...",
  "✨ Building your custom AeroVibe travel blueprint...",
]

export default function Home() {
  const [view, setView] = useState<"home" | "loading" | "itinerary">("home")
  const [destination, setDestination] = useState("")
  const [itinerary, setItinerary] = useState<ItineraryData | null>(null)
  const [loadingPhraseIndex, setLoadingPhraseIndex] = useState(0)
  const [activeTab, setActiveTab] = useState<"days" | "stays" | "food" | "tips">("days")
  const [selectedDay, setSelectedDay] = useState(1)



  // Rotate loading phrases during load
  useEffect(() => {
    if (view !== "loading") return
    const interval = setInterval(() => {
      setLoadingPhraseIndex((prev) => (prev + 1) % LOADING_PHRASES.length)
    }, 2500)
    return () => clearInterval(interval)
  }, [view])

  const handlePlanTrip = useCallback(async (dest: string) => {
    setDestination(dest)
    setView("loading")
    setLoadingPhraseIndex(0)

    try {
      const response = await fetch("/api/travel", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ destination: dest }),
      })

      if (!response.ok) {
        throw new Error("Failed to generate itinerary")
      }

      const data: ItineraryData = await response.json()
      setItinerary(data)
      setView("itinerary")
      setActiveTab("days")
      setSelectedDay(1)
    } catch (err) {
      console.error("Error creating plan:", err)
      setView("home")
    }
  }, [])

  const handleBackToHome = () => {
    setView("home")
    setItinerary(null)
  }

  return (
    <main className="min-h-screen text-white bg-[#070712] relative overflow-hidden font-sans">
      <AnimatePresence mode="wait">
        
        {/* VIEW 1: LANDING/HERO PAGE */}
        {view === "home" && (
          <motion.div
            key="home"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full h-full"
          >
            <AeroVibeHero onPlanTrip={handlePlanTrip} />
          </motion.div>
        )}

        {/* VIEW 2: HIGH-END LOADER SCREEN */}
        {view === "loading" && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center p-6 bg-gradient-to-br from-[#060613] via-[#0c0d2b] to-[#120722]"
          >
            <AuroraBlobs />
            <StarField />
            
            <div className="relative z-10 flex flex-col items-center max-w-md text-center">
              {/* Spinning Logo Sphere */}
              <div className="relative w-24 h-24 mb-10">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 rounded-full border border-purple-500/30 border-t-purple-500 border-r-sky-500"
                  style={{ boxShadow: "0 0 30px rgba(108,47,247,0.3)" }}
                />
                <motion.div
                  animate={{ rotate: -360 }}
                  transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-2 rounded-full border border-sky-500/20 border-b-sky-400 border-l-purple-400"
                />
                <div className="absolute inset-0 flex items-center justify-center text-3xl">
                  🛫
                </div>
              </div>

              {/* Status Header */}
              <h2 className="text-2xl font-bold tracking-tight mb-2">
                Assembling Blueprint
              </h2>
              <p className="text-white/40 text-sm mb-8 uppercase tracking-widest">
                Destination: <span className="text-purple-400 font-semibold">{destination}</span>
              </p>

              {/* Interactive Glowing Status Bar */}
              <div className="w-64 h-1.5 bg-white/5 rounded-full overflow-hidden mb-6 relative border border-white/5">
                <motion.div
                  className="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-[#6c2ff7] to-[#0ea5e9] rounded-full"
                  initial={{ width: "5%" }}
                  animate={{ width: "95%" }}
                  transition={{ duration: 12, ease: "easeInOut" }}
                />
              </div>

              {/* Status Text Changer */}
              <AnimatePresence mode="wait">
                <motion.p
                  key={loadingPhraseIndex}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.4 }}
                  className="text-white/70 text-sm font-medium tracking-wide h-6"
                >
                  {LOADING_PHRASES[loadingPhraseIndex]}
                </motion.p>
              </AnimatePresence>
            </div>
          </motion.div>
        )}

        {/* VIEW 3: TRAVEL BLUEPRINT RESULTS DASHBOARD */}
        {view === "itinerary" && itinerary && (
          <motion.div
            key="itinerary"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full min-h-screen relative py-8 px-6 md:px-12 flex flex-col bg-gradient-to-br from-[#060613] via-[#0c0d2b] to-[#120722]"
          >
            <AuroraBlobs />
            <StarField />

            {/* Grid Overlay */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                zIndex: 2,
                backgroundImage:
                  "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px)," +
                  "linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
                backgroundSize: "60px 60px",
                maskImage: "radial-gradient(ellipse 80% 80% at 50% 40%, black 50%, transparent 100%)",
                WebkitMaskImage: "radial-gradient(ellipse 80% 80% at 50% 40%, black 50%, transparent 100%)",
              }}
            />

            <div className="relative z-10 max-w-6xl w-full mx-auto flex-1 flex flex-col">
              
              {/* Itinerary Header */}
              <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-8 mb-4 border-b border-white/10">
                <div className="flex items-center gap-4">
                  <button
                    onClick={handleBackToHome}
                    className="p-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 transition-all text-xs font-semibold uppercase tracking-wider flex items-center gap-2 group active:scale-95"
                  >
                    <span className="group-hover:-translate-x-1 transition-transform">←</span> Home
                  </button>
                  <div>
                    <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
                      {itinerary.destination}
                    </h1>
                    <p className="text-white/40 text-xs mt-1 uppercase tracking-widest font-semibold">
                      🎫 Custom AI Travel Blueprint
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => window.print()}
                    className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all flex items-center gap-1.5 active:scale-95"
                  >
                    🖨 Print Blueprint
                  </button>
                  <button
                    onClick={handleBackToHome}
                    className="px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-[#6c2ff7] to-[#0ea5e9] hover:brightness-110 active:scale-95 transition-all shadow-[0_0_20px_rgba(108,47,247,0.3)]"
                  >
                    ✈️ Customise New Vibe
                  </button>
                </div>
              </header>

              {/* Demo Mode / Real-Time Sync Indicator Banner */}
              {itinerary.isDemo ? (
                <div 
                  className="mb-6 p-4 rounded-2xl border border-purple-500/20 bg-purple-500/5 backdrop-blur-md flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  style={{ boxShadow: "0 0 15px rgba(168,85,247,0.1)" }}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-purple-400 animate-pulse" />
                    <span className="text-purple-300 font-semibold">✨ Running in Demo Mode (Procedural Blueprint)</span>
                  </div>
                  <p className="text-white/60">
                    To unlock personalized real-time AI blueprints, ensure your GEMINI_API_KEY is configured in the .env.local file.
                  </p>
                </div>
              ) : (
                <div 
                  className="mb-6 p-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 backdrop-blur-md flex items-center gap-2 text-xs"
                  style={{ boxShadow: "0 0 15px rgba(16,185,129,0.1)" }}
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-emerald-300 font-semibold">⚡ Real-Time AI Blueprint synced successfully using Gemini 3.5 Flash!</span>
                </div>
              )}

              {/* Main Dashboard Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 flex-1 items-start">
                
                {/* Side Navigation Panel */}
                <div className="lg:col-span-1 space-y-3">
                  <div className="p-4 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl">
                    <p className="text-[10px] text-white/30 tracking-widest font-bold uppercase mb-4">
                      Explore Categories
                    </p>
                    <div className="flex lg:flex-col gap-2 overflow-x-auto pb-2 lg:pb-0 scrollbar-none">
                      {(
                        [
                          { id: "days", label: "📅 Day-by-Day", color: "purple" },
                          { id: "stays", label: "🏨 Boutique Stays", color: "blue" },
                          { id: "food", label: "🍜 Culinary Secrets", color: "green" },
                          { id: "tips", label: "💡 Local Insights", color: "pink" },
                        ] as const
                      ).map((tab) => {
                        const active = activeTab === tab.id
                        return (
                          <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex-shrink-0 text-left px-4 py-3 rounded-xl text-xs font-semibold border transition-all flex items-center gap-2.5 w-full ${
                              active
                                ? "bg-white/10 border-white/20 text-white shadow-[0_0_15px_rgba(255,255,255,0.05)]"
                                : "bg-transparent border-transparent text-white/50 hover:bg-white/5 hover:text-white"
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                tab.color === "purple"
                                  ? "bg-purple-400"
                                  : tab.color === "blue"
                                  ? "bg-sky-400"
                                  : tab.color === "green"
                                  ? "bg-emerald-400"
                                  : "bg-pink-400"
                              }`}
                            />
                            {tab.label}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Day Picker Submenu (Only active when 'days' tab is highlighted) */}
                  {activeTab === "days" && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl"
                    >
                      <p className="text-[10px] text-white/30 tracking-widest font-bold uppercase mb-3">
                        Timeline Days
                      </p>
                      <div className="grid grid-cols-3 lg:grid-cols-1 gap-2">
                        {itinerary.days.map((day) => (
                          <button
                            key={day.num}
                            onClick={() => setSelectedDay(day.num)}
                            className={`px-3 py-2.5 rounded-xl text-xs font-semibold border text-center transition-all ${
                              selectedDay === day.num
                                ? "bg-purple-500/20 border-purple-500/50 text-purple-300"
                                : "bg-white/5 border-transparent text-white/60 hover:bg-white/10"
                            }`}
                          >
                            Day {day.num}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* Main Content Area */}
                <div className="lg:col-span-3 flex flex-col gap-6">
                  <AnimatePresence mode="wait">
                    
                    {/* TAB A: DAY BY DAY DETAILS */}
                    {activeTab === "days" && (
                      <motion.div
                        key="days-tab"
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -15 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-6"
                      >
                        {itinerary.days
                          .filter((day) => day.num === selectedDay)
                          .map((day) => (
                            <div key={day.num} className="space-y-6">
                              
                              {/* Day Header Summary */}
                              <div className="p-6 rounded-3xl border border-purple-500/20 bg-purple-500/5 backdrop-blur-xl relative overflow-hidden">
                                <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-purple-500/60 to-transparent" />
                                <span className="inline-block text-[10px] font-bold text-purple-400 bg-purple-500/10 border border-purple-500/20 px-2 py-1 rounded-full mb-3 uppercase tracking-wider">
                                  🌌 Day {day.num} Focus
                                </span>
                                <h3 className="text-xl md:text-2xl font-bold mb-2">
                                  {day.title}
                                </h3>
                                <p className="text-white/60 text-sm leading-relaxed">
                                  {day.description}
                                </p>
                              </div>

                              {/* Daily Timeline */}
                              <div className="space-y-4">
                                {day.activities.map((activity, idx) => (
                                  <div
                                    key={idx}
                                    className="flex gap-4 p-5 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl hover:border-white/20 transition-all"
                                  >
                                    {/* Vertical indicator badge */}
                                    <div className="flex flex-col items-center flex-shrink-0">
                                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold ${
                                        activity.time.toLowerCase().includes("morning")
                                          ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                                          : activity.time.toLowerCase().includes("afternoon")
                                          ? "bg-sky-500/20 text-sky-300 border border-sky-500/30"
                                          : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                                      }`}>
                                        {activity.time.charAt(0)}
                                      </div>
                                      <div className="w-[1px] flex-1 bg-white/10 mt-3" />
                                    </div>

                                    {/* Activity descriptions */}
                                    <div className="flex-1">
                                      <span className="text-[10px] text-white/40 tracking-wider uppercase font-bold">
                                        {activity.time}
                                      </span>
                                      <h4 className="text-base font-bold text-white/95 mt-0.5">
                                        {activity.spot}
                                      </h4>
                                      <p className="text-white/50 text-xs mt-2 leading-relaxed">
                                        {activity.desc}
                                      </p>
                                    </div>
                                  </div>
                                ))}
                              </div>

                            </div>
                          ))}
                      </motion.div>
                    )}

                    {/* TAB B: BOUTIQUE STAYS AND LODGES */}
                    {activeTab === "stays" && (
                      <motion.div
                        key="stays-tab"
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -15 }}
                        className="grid grid-cols-1 md:grid-cols-3 gap-4"
                      >
                        {itinerary.stays.map((stay, idx) => (
                          <div
                            key={idx}
                            className="p-5 rounded-2xl border border-sky-500/20 bg-sky-500/5 backdrop-blur-xl flex flex-col justify-between hover:border-sky-400/50 transition-all relative overflow-hidden"
                            style={{ boxShadow: "0 4px 30px rgba(56, 189, 248, 0.05)" }}
                          >
                            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-sky-400/60 to-transparent" />
                            <div>
                              <div className="text-3xl mb-4">{stay.emoji}</div>
                              <h4 className="text-base font-bold text-white/95 mb-1">{stay.name}</h4>
                              <span className="inline-block text-[9px] font-bold text-sky-300 bg-sky-400/10 border border-sky-500/20 px-2 py-0.5 rounded-full mb-3 uppercase tracking-wider">
                                {stay.vibe}
                              </span>
                              <p className="text-white/50 text-xs leading-relaxed mb-4">{stay.desc}</p>
                            </div>
                            <div className="text-xs font-bold text-sky-300 pt-3 border-t border-white/5">
                              💰 Price: {stay.price}
                            </div>
                          </div>
                        ))}
                      </motion.div>
                    )}

                    {/* TAB C: FOOD AND DINING SECRETS */}
                    {activeTab === "food" && (
                      <motion.div
                        key="food-tab"
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -15 }}
                        className="grid grid-cols-1 md:grid-cols-3 gap-4"
                      >
                        {itinerary.food.map((item, idx) => (
                          <div
                            key={idx}
                            className="p-5 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 backdrop-blur-xl flex flex-col justify-between hover:border-emerald-400/50 transition-all relative overflow-hidden"
                            style={{ boxShadow: "0 4px 30px rgba(52, 211, 153, 0.05)" }}
                          >
                            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-emerald-400/60 to-transparent" />
                            <div>
                              <div className="text-3xl mb-4">{item.emoji}</div>
                              <h4 className="text-base font-bold text-white/95 mb-0.5">{item.dish}</h4>
                              <p className="text-[10px] text-emerald-300 font-medium mb-3 italic">
                                at {item.restaurant}
                              </p>
                              <p className="text-white/50 text-xs leading-relaxed mb-4">{item.desc}</p>
                            </div>
                            <div className="text-xs font-bold text-emerald-300 pt-3 border-t border-white/5">
                              🏷️ Range: {item.priceRange}
                            </div>
                          </div>
                        ))}
                      </motion.div>
                    )}

                    {/* TAB D: LOCAL TIPS AND ADVICE */}
                    {activeTab === "tips" && (
                      <motion.div
                        key="tips-tab"
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -15 }}
                        className="p-6 rounded-2xl border border-pink-500/20 bg-pink-500/5 backdrop-blur-xl relative overflow-hidden"
                      >
                        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-pink-400/60 to-transparent" />
                        <h3 className="text-lg font-bold mb-5 flex items-center gap-2">
                          <span>💡</span> Insider Coordinates & Advice
                        </h3>
                        <div className="space-y-4">
                          {itinerary.tips.map((tip, idx) => (
                            <div
                              key={idx}
                              className="flex items-start gap-3 p-3.5 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 transition-colors"
                            >
                              <span className="w-5 h-5 rounded-full bg-pink-400/20 flex items-center justify-center text-xs font-bold text-pink-300 flex-shrink-0 mt-0.5">
                                {idx + 1}
                              </span>
                              <p className="text-white/70 text-xs leading-relaxed">{tip}</p>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}

                  </AnimatePresence>
                </div>

              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  )
}
