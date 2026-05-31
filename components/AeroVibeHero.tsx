"use client"

import React, { useState, useEffect, useRef, useCallback } from "react"
import { motion } from "framer-motion"

// ─── Types ────────────────────────────────────────────────────────────────────

type DestColor = "purple" | "blue" | "green" | "pink"

interface Destination {
  name: string
  emoji: string
  desc: string
  color: DestColor
}

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

interface ColorConfig {
  card: string
  topLine: string
  cta: string
  glow: string
  border: string
}

// ─── Constants ────────────────────────────────────────────────────────────────

const POPULAR_DESTINATIONS: Destination[] = [
  { name: "Kyoto, Japan",       emoji: "🌸", desc: "Bamboo forests, zen temples, sakura season", color: "purple" },
  { name: "Paris, France",      emoji: "🗼", desc: "Art, romance, world-class dining",            color: "blue"   },
  { name: "Bali, Indonesia",    emoji: "🌴", desc: "Tropical beaches, volcanic landscapes",       color: "green"  },
  { name: "Reykjavik, Iceland", emoji: "🌋", desc: "Northern lights, hot springs, glaciers",      color: "pink"   },
]

interface CarouselDay {
  num: number
  title: string
  sub: string
  chip: string
  bg: string
  border: string
  numBg: string
  numColor: string
  chipBg: string
  chipColor: string
}

interface PassConfig {
  destination: string
  originIata: string
  originCity: string
  iata: string
  fullName: string
  defaultQuery: string
  gradient: string
  glow: string
  days: CarouselDay[]
}

const CAROUSEL_PASSES: PassConfig[] = [
  {
    destination: "Kyoto",
    originIata: "DEL",
    originCity: "Delhi, IN",
    iata: "KYO",
    fullName: "Kyoto, Japan",
    defaultQuery: "Kyoto for 7 days",
    gradient: "linear-gradient(90deg, transparent, rgba(168,85,247,0.8), rgba(236,72,153,0.8), transparent)",
    glow: "0 0 60px rgba(168,85,247,0.15), 0 0 100px rgba(236,72,153,0.08)",
    days: [
      { num: 1, title: "Arashiyama Bamboo Path", sub: "Walk the soaring green stalks at sunrise", chip: "Morning", bg: "rgba(168,85,247,0.15)", border: "rgba(168,85,247,0.3)", numBg: "rgba(168,85,247,0.5)", numColor: "#d8b4fe", chipBg: "rgba(168,85,247,0.3)", chipColor: "#d8b4fe" },
      { num: 2, title: "Fushimi Inari Gates", sub: "Trek the 10,000 glowing vermillion shrines", chip: "Full day", bg: "rgba(236,72,153,0.15)", border: "rgba(236,72,153,0.3)", numBg: "rgba(236,72,153,0.5)", numColor: "#f9a8d4", chipBg: "rgba(236,72,153,0.3)", chipColor: "#f9a8d4" },
      { num: 3, title: "Gion District Tea Houses", sub: "Taste organic matcha in vintage alleys", chip: "Culture", bg: "rgba(16,185,129,0.12)", border: "rgba(16,185,129,0.25)", numBg: "rgba(16,185,129,0.4)", numColor: "#6ee7b7", chipBg: "rgba(16,185,129,0.25)", chipColor: "#6ee7b7" }
    ]
  },
  {
    destination: "Bali",
    originIata: "BOM",
    originCity: "Mumbai, IN",
    iata: "DPS",
    fullName: "Bali, Indonesia",
    defaultQuery: "Bali for 10 days",
    gradient: "linear-gradient(90deg, transparent, rgba(14,165,233,0.8), rgba(16,185,129,0.8), transparent)",
    glow: "0 0 60px rgba(14,165,233,0.15), 0 0 100px rgba(16,185,129,0.08)",
    days: [
      { num: 1, title: "Uluwatu Cliff Sunset", sub: "Witness coastal waves & fire dances", chip: "Evening", bg: "rgba(14,165,233,0.15)", border: "rgba(14,165,233,0.3)", numBg: "rgba(14,165,233,0.5)", numColor: "#7dd3fc", chipBg: "rgba(14,165,233,0.3)", chipColor: "#7dd3fc" },
      { num: 2, title: "Ubud Rice Terraces", sub: "Swing over infinite cascading green hills", chip: "Full day", bg: "rgba(16,185,129,0.12)", border: "rgba(16,185,129,0.25)", numBg: "rgba(16,185,129,0.4)", numColor: "#6ee7b7", chipBg: "rgba(16,185,129,0.25)", chipColor: "#6ee7b7" },
      { num: 3, title: "Seminyak Beach Lounge", sub: "Catch warm curls & fresh seafood grills", chip: "Leisure", bg: "rgba(245,158,11,0.12)", border: "rgba(245,158,11,0.25)", numBg: "rgba(245,158,11,0.4)", numColor: "#fcd34d", chipBg: "rgba(245,158,11,0.25)", chipColor: "#fcd34d" }
    ]
  },
  {
    destination: "Reykjavik",
    originIata: "BLR",
    originCity: "Bengaluru, IN",
    iata: "KEF",
    fullName: "Reykjavik, Iceland",
    defaultQuery: "Reykjavik for 8 days",
    gradient: "linear-gradient(90deg, transparent, rgba(56,189,248,0.8), rgba(168,85,247,0.8), transparent)",
    glow: "0 0 60px rgba(56,189,248,0.15), 0 0 100px rgba(168,85,247,0.08)",
    days: [
      { num: 1, title: "Golden Circle Geysers", sub: "Watch massive bubbling springs burst", chip: "Sightsee", bg: "rgba(56,189,248,0.15)", border: "rgba(56,189,248,0.3)", numBg: "rgba(56,189,248,0.5)", numColor: "#7dd3fc", chipBg: "rgba(56,189,248,0.3)", chipColor: "#7dd3fc" },
      { num: 2, title: "Blue Lagoon Retreat", sub: "Soak in hot silica pools amidst lava rocks", chip: "Wellness", bg: "rgba(168,85,247,0.15)", border: "rgba(168,85,247,0.3)", numBg: "rgba(168,85,247,0.5)", numColor: "#d8b4fe", chipBg: "rgba(168,85,247,0.3)", chipColor: "#d8b4fe" },
      { num: 3, title: "Indigo Aurora Chase", sub: "Track neon curtains dancing in night skies", chip: "Adventure", bg: "rgba(236,72,153,0.15)", border: "rgba(236,72,153,0.3)", numBg: "rgba(236,72,153,0.5)", numColor: "#f9a8d4", chipBg: "rgba(236,72,153,0.3)", chipColor: "#f9a8d4" }
    ]
  },
  {
    destination: "Amalfi",
    originIata: "DEL",
    originCity: "Delhi, IN",
    iata: "NAP",
    fullName: "Amalfi Coast, Italy",
    defaultQuery: "Amalfi for 6 days",
    gradient: "linear-gradient(90deg, transparent, rgba(236,72,153,0.8), rgba(245,158,11,0.8), transparent)",
    glow: "0 0 60px rgba(236,72,153,0.15), 0 0 100px rgba(245,158,11,0.08)",
    days: [
      { num: 1, title: "Positano Pastel Walk", sub: "Wander historic steps to ocean shores", chip: "Relax", bg: "rgba(236,72,153,0.15)", border: "rgba(236,72,153,0.3)", numBg: "rgba(236,72,153,0.5)", numColor: "#f9a8d4", chipBg: "rgba(236,72,153,0.3)", chipColor: "#f9a8d4" },
      { num: 2, title: "Ravello Cliff Gardens", sub: "Look over infinite blue sea balconies", chip: "Scenic", bg: "rgba(245,158,11,0.12)", border: "rgba(245,158,11,0.25)", numBg: "rgba(245,158,11,0.4)", numColor: "#fcd34d", chipBg: "rgba(245,158,11,0.25)", chipColor: "#fcd34d" },
      { num: 3, title: "Path of the Gods", sub: "Hike rustic shepherd paths over water", chip: "Trek", bg: "rgba(16,185,129,0.12)", border: "rgba(16,185,129,0.25)", numBg: "rgba(16,185,129,0.4)", numColor: "#6ee7b7", chipBg: "rgba(16,185,129,0.25)", chipColor: "#6ee7b7" }
    ]
  }
]

const DEST_COLORS: Record<DestColor, ColorConfig> = {
  purple: {
    card:    "border-purple-500/20 hover:border-purple-400/50",
    topLine: "from-transparent via-purple-500/80 to-transparent",
    cta:     "text-purple-300",
    glow:    "hover:shadow-[0_8px_40px_rgba(168,85,247,0.25)]",
    border:  "rgba(168,85,247,0.15)",
  },
  blue: {
    card:    "border-sky-500/20 hover:border-sky-400/50",
    topLine: "from-transparent via-sky-400/80 to-transparent",
    cta:     "text-sky-300",
    glow:    "hover:shadow-[0_8px_40px_rgba(56,189,248,0.25)]",
    border:  "rgba(56,189,248,0.15)",
  },
  green: {
    card:    "border-emerald-500/20 hover:border-emerald-400/50",
    topLine: "from-transparent via-emerald-400/80 to-transparent",
    cta:     "text-emerald-300",
    glow:    "hover:shadow-[0_8px_40px_rgba(52,211,153,0.25)]",
    border:  "rgba(52,211,153,0.12)",
  },
  pink: {
    card:    "border-pink-500/20 hover:border-pink-400/50",
    topLine: "from-transparent via-pink-400/80 to-transparent",
    cta:     "text-pink-300",
    glow:    "hover:shadow-[0_8px_40px_rgba(244,114,182,0.25)]",
    border:  "rgba(244,114,182,0.12)",
  },
}

const CARD_BG: Record<DestColor, string> = {
  purple: "rgba(88,28,235,0.1)",
  blue:   "rgba(14,165,233,0.1)",
  green:  "rgba(16,185,129,0.1)",
  pink:   "rgba(236,72,153,0.1)",
}

// ─── Cursor-Reactive Star Field ───────────────────────────────────────────────

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
      const INFLUENCE = 12   // how many % units the cursor pulls stars
      const RADIUS    = 18   // influence radius in % units

      starsRef.current.forEach((star) => {
        const dx   = mx - star.baseX
        const dy   = my - star.baseY
        const dist = Math.sqrt(dx * dx + dy * dy)

        // Smoothly attract nearby stars toward cursor
        if (dist < RADIUS && dist > 0.1) {
          const force   = (1 - dist / RADIUS) * INFLUENCE
          const targetX = star.baseX + (dx / dist) * force
          const targetY = star.baseY + (dy / dist) * force
          star.x += (targetX - star.x) * 0.08
          star.y += (targetY - star.y) * 0.08
        } else {
          // Drift back to base position
          star.x += (star.baseX - star.x) * 0.04
          star.y += (star.baseY - star.y) * 0.04
        }

        // Twinkle via sine wave
        const twinkle = 0.5 + 0.5 * Math.sin((timestamp / 1000 + star.delay) * (6.28 / star.duration))
        const alpha   = star.opacity * (0.4 + 0.6 * twinkle)

        const px = (star.x / 100) * w
        const py = (star.y / 100) * h

        // Glow for larger stars
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

// ─── Aurora Blobs ─────────────────────────────────────────────────────────────

function AuroraBlobs() {
  const blobs = [
    { style: { top: "-6rem", left: "-5rem", width: 500, height: 400 }, bg: "radial-gradient(ellipse, #6c2ff7 0%, #3b0fa0 60%, transparent 100%)", anim: { x:[0,30,0], y:[0,40,0], scale:[1,1.15,1] }, dur: 14, delay: 0   },
    { style: { top: "3rem", right: "-6rem", width: 450, height: 350 }, bg: "radial-gradient(ellipse, #0ea5e9 0%, #0369a1 60%, transparent 100%)", anim: { x:[0,-25,0], y:[0,35,0], scale:[1,1.1,1]  }, dur: 11, delay: 4   },
    { style: { bottom: "3rem", left: "20%",  width: 350, height: 300 }, bg: "radial-gradient(ellipse, #ec4899 0%, #9d174d 60%, transparent 100%)", anim: { x:[0,20,0], y:[0,-30,0], scale:[1,1.12,1] }, dur: 16, delay: 8   },
    { style: { bottom: "-4rem", right: "10%", width: 300, height: 250 }, bg: "radial-gradient(ellipse, #10b981 0%, #064e3b 60%, transparent 100%)", anim: { x:[0,-20,0], y:[0,-25,0], scale:[1,1.08,1] }, dur: 13, delay: 2   },
    { style: { top: "35%", left: "38%",  width: 280, height: 220 }, bg: "radial-gradient(ellipse, #f59e0b 0%, #92400e 60%, transparent 100%)", anim: { x:[0,15,0], y:[0,20,0], scale:[1,1.2,1]   }, dur: 18, delay: 6, opacity: 0.3 },
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
            opacity: b.opacity ?? 0.55,
            position: "absolute",
          }}
        />
      ))}
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface AeroVibeHeroProps {
  onPlanTrip?: (destination: string) => void
}

export default function AeroVibeHero({ onPlanTrip }: AeroVibeHeroProps) {
  const [destination, setDestination] = useState("")
  const [durationDays, setDurationDays] = useState(3)
  const [carouselIndex, setCarouselIndex] = useState(0)

  // Auto-cycle boarding pass carousel every 5 seconds (paused if user is actively typing custom input)
  useEffect(() => {
    if (destination.trim()) return
    const interval = setInterval(() => {
      setCarouselIndex((prev) => (prev + 1) % CAROUSEL_PASSES.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [destination])

  const handleSearch = useCallback((dest?: string, daysOverride?: number) => {
    const activeDays = daysOverride ?? durationDays
    const rawInput = (dest ?? destination ?? "").trim()
    
    if (!rawInput) {
      // Default fallback
      onPlanTrip?.("Bali for 3 days")
      return
    }

    // Check if user already wrote days inside the input text
    const hasDaysWord = /\b\d+\s*days?\b/i.test(rawInput)
    if (hasDaysWord) {
      onPlanTrip?.(rawInput)
    } else {
      // Clean query and append selector's selected days count
      onPlanTrip?.(`${rawInput} for ${activeDays} days`)
    }
  }, [destination, durationDays, onPlanTrip])

  return (
    <div
      className="relative min-h-screen w-full overflow-hidden text-white"
      style={{ background: "linear-gradient(135deg, #0a0a1a 0%, #0d1535 40%, #1a0a2e 70%, #0d1535 100%)" }}
    >
      {/* Layer 0: aurora */}
      <AuroraBlobs />

      {/* Layer 1: cursor-reactive star canvas */}
      <StarField />

      {/* Layer 2: grid overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          zIndex: 2,
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px)," +
            "linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
          maskImage: "radial-gradient(ellipse 80% 80% at 50% 40%, black 50%, transparent 100%)",
          WebkitMaskImage: "radial-gradient(ellipse 80% 80% at 50% 40%, black 50%, transparent 100%)",
        }}
      />

      {/* Layer 3+: all UI content */}
      <div className="relative" style={{ zIndex: 10 }}>

        {/* Floating status badges */}
        {[
          { text: "✈ Flight mapping active",  dot: "#a78bfa", glow: "rgba(167,139,250,0.8)", pos: "top-[72px] left-5",             delay: 0 },
          { text: "🧭 AI coordinates synced", dot: "#38bdf8", glow: "rgba(56,189,248,0.8)",  pos: "top-[130px] right-4 hidden md:flex", delay: 2 },
          { text: "🌍 100+ global blueprints", dot: "#4ade80", glow: "rgba(74,222,128,0.8)",  pos: "bottom-[100px] left-4 hidden md:flex", delay: 4 },
        ].map((b) => (
          <motion.div
            key={b.text}
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: b.delay }}
            className={`absolute z-20 flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 backdrop-blur-md text-white/70 text-xs font-medium ${b.pos}`}
            style={{ background: "rgba(255,255,255,0.06)" }}
          >
            <span
              className="w-2 h-2 rounded-full animate-pulse flex-shrink-0"
              style={{ background: b.dot, boxShadow: `0 0 8px ${b.glow}` }}
            />
            {b.text}
          </motion.div>
        ))}

        {/* ── Navbar ── */}
        <header className="flex items-center justify-between px-6 md:px-8 py-5 max-w-6xl mx-auto">
          <div className="flex items-center gap-2.5 cursor-pointer select-none">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
              style={{ background: "linear-gradient(135deg, #6c2ff7, #0ea5e9)", boxShadow: "0 0 20px rgba(108,47,247,0.6)" }}
            >
              🛫
            </div>
            <span className="font-bold text-xl tracking-tight">AeroVibe</span>
          </div>

          <nav className="flex items-center gap-2">
            <button
              onClick={() => {
                const options = [
                  { d: "Kyoto, Japan", days: 7 },
                  { d: "Paris, France", days: 5 },
                  { d: "Bali, Indonesia", days: 10 },
                  { d: "Amalfi, Italy", days: 6 }
                ]
                const random = options[Math.floor(Math.random() * options.length)]
                setDestination(random.d)
                setDurationDays(random.days)
                handleSearch(random.d, random.days)
              }}
              className="hidden sm:block px-4 py-2 rounded-full text-xs font-medium border border-white/20 text-white/80 hover:bg-white/10 hover:border-white/40 hover:text-white transition-all"
            >
              Discover 🌍
            </button>
            <button
              onClick={() => {
                const experiences = [
                  { d: "Reykjavik, Iceland", days: 8 },
                  { d: "Amalfi Coast, Italy", days: 7 }
                ]
                const random = experiences[Math.floor(Math.random() * experiences.length)]
                setDestination(random.d)
                setDurationDays(random.days)
                handleSearch(random.d, random.days)
              }}
              className="hidden sm:block px-4 py-2 rounded-full text-xs font-medium border border-white/20 text-white/80 hover:bg-white/10 hover:border-white/40 hover:text-white transition-all"
            >
              Experiences ✨
            </button>
            <button
              onClick={() => handleSearch()}
              className="px-4 py-2 rounded-full text-xs font-semibold text-white transition-all hover:brightness-110 active:scale-95"
              style={{ background: "linear-gradient(135deg, #6c2ff7, #0ea5e9)", boxShadow: "0 0 20px rgba(108,47,247,0.4)" }}
            >
              Start Planning →
            </button>
          </nav>
        </header>

        {/* ── Hero grid ── */}
        <section className="max-w-6xl mx-auto px-6 md:px-8 pt-10 pb-16 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

          {/* Left: copy + search */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, type: "spring" }}
            className="space-y-6"
          >
            {/* Badge */}
            <div
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium"
              style={{ background: "rgba(108,47,247,0.2)", border: "1px solid rgba(108,47,247,0.5)", color: "#c4a8ff" }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full animate-pulse"
                style={{ background: "#a78bfa", boxShadow: "0 0 6px rgba(167,139,250,0.8)" }}
              />
              Next-Gen Travel Intelligence
            </div>

            {/* Headline */}
            <h1 className="text-5xl sm:text-6xl font-semibold leading-[1.05] tracking-tight">
              The Art of
              <br />
              <span
                style={{
                  background: "linear-gradient(90deg, #a78bfa 0%, #38bdf8 50%, #f0abfc 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                Effortless
                <br />
                Exploration
              </span>
            </h1>

            <p className="text-base text-white/55 leading-relaxed max-w-md">
              Skip hours of research. AeroVibe merges advanced generative intelligence with local expertise
              to craft personalized travel blueprints tailored to your vibe.
            </p>

            {/* Search bar */}
            <div
              className="flex items-center rounded-2xl px-4 py-1.5 transition-all focus-within:shadow-[0_0_40px_rgba(108,47,247,0.3)] gap-2"
              style={{
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.15)",
                boxShadow: "0 0 40px rgba(108,47,247,0.15)",
              }}
            >
              <span className="text-white/40 text-base flex-shrink-0">📍</span>
              <input
                type="text"
                placeholder="Where is your heart pointing? (e.g. Kyoto...)"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="flex-1 bg-transparent border-none outline-none text-white placeholder-white/35 text-sm py-2.5"
                style={{ fontFamily: "inherit", minWidth: 0 }}
              />

              {/* Dynamic Number of Days Dropdown Select */}
              <div className="flex items-center gap-1.5 flex-shrink-0 border-l border-white/10 pl-3">
                <span className="text-xs text-white/45 hidden sm:inline">Days:</span>
                <select
                  value={durationDays}
                  onChange={(e) => setDurationDays(Number(e.target.value))}
                  className="bg-[#0f0e26]/80 backdrop-blur-xl border border-white/10 text-white/90 text-xs font-semibold rounded-xl px-2.5 py-1.5 cursor-pointer outline-none focus:border-purple-500/50 hover:bg-white/5 transition-all"
                  style={{ colorScheme: "dark" }}
                >
                  {[...Array(15)].map((_, i) => (
                    <option key={i + 1} value={i + 1} className="bg-[#0c0d2b] text-white">
                      {i + 1} Day{i + 1 > 1 ? "s" : ""}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={() => handleSearch()}
                className="flex-shrink-0 px-5 py-3 rounded-xl text-sm font-semibold text-white transition-all hover:brightness-110 active:scale-95"
                style={{
                  background: "linear-gradient(135deg, #6c2ff7, #0ea5e9)",
                  boxShadow: "0 0 20px rgba(108,47,247,0.5)",
                  fontFamily: "inherit",
                }}
              >
                Explore Vibe ✈
              </button>
            </div>

            {/* Stats row */}
            <div className="flex flex-wrap gap-5">
              {(
                [
                  { icon: "🛡️", bg: "rgba(108,47,247,0.3)", color: "#c4a8ff", label: "Verified routes"   },
                  { icon: "⚡",  bg: "rgba(14,165,233,0.3)",  color: "#7dd3fc", label: "Instant itinerary" },
                  { icon: "✨",  bg: "rgba(236,72,153,0.3)",  color: "#f9a8d4", label: "AI-personalised"  },
                ] as const
              ).map((s) => (
                <div key={s.label} className="flex items-center gap-2">
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-xs"
                    style={{ background: s.bg, color: s.color }}
                  >
                    {s.icon}
                  </div>
                  <span className="text-xs text-white/55 font-medium">{s.label}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Right: boarding pass card */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, type: "spring", delay: 0.15 }}
          >
            <div
              className="rounded-3xl p-6 relative overflow-hidden backdrop-blur-xl transition-all duration-700"
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.12)",
                boxShadow: destination.trim() ? "0 0 60px rgba(108,47,247,0.15), 0 0 100px rgba(14,165,233,0.08)" : CAROUSEL_PASSES[carouselIndex].glow,
              }}
            >
              {/* Top shimmer */}
              <div
                className="absolute top-0 left-0 right-0 h-px transition-all duration-700"
                style={{ background: destination.trim() ? "linear-gradient(90deg, transparent, rgba(108,47,247,0.8), rgba(14,165,233,0.8), transparent)" : CAROUSEL_PASSES[carouselIndex].gradient }}
              />

              {/* Card header */}
              <div className="flex justify-between items-center mb-5">
                <div className="flex items-center gap-1">
                  <span className="text-xs font-semibold tracking-widest uppercase text-purple-300">
                    🎫 Boarding pass
                  </span>
                  
                  {/* Manual Carousel controls */}
                  {!destination.trim() && (
                    <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-full px-2 py-0.5 ml-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setCarouselIndex((prev) => (prev - 1 + CAROUSEL_PASSES.length) % CAROUSEL_PASSES.length)
                        }}
                        className="text-[9px] text-white/50 hover:text-white/90 p-0.5 transition-colors cursor-pointer select-none"
                        title="Previous Pass"
                      >
                        ◀
                      </button>
                      <span className="text-[8px] font-bold text-white/60 tracking-wider">
                        {carouselIndex + 1}/{CAROUSEL_PASSES.length}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setCarouselIndex((prev) => (prev + 1) % CAROUSEL_PASSES.length)
                        }}
                        className="text-[9px] text-white/50 hover:text-white/90 p-0.5 transition-colors cursor-pointer select-none"
                        title="Next Pass"
                      >
                        ▶
                      </button>
                    </div>
                  )}
                </div>

                <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-400">
                  <span
                    className="w-1.5 h-1.5 rounded-full animate-pulse"
                    style={{ background: "#4ade80", boxShadow: "0 0 6px rgba(74,222,128,0.8)" }}
                  />
                  AI Active
                </span>
              </div>

              {/* Route visual */}
              <motion.div
                key={`route-${carouselIndex}`}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="flex items-center justify-between p-4 rounded-2xl mb-4"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
              >
                <div className="text-center">
                  <div className="text-3xl font-bold tracking-tight text-purple-400">
                    {destination.trim() ? "DEL" : CAROUSEL_PASSES[carouselIndex].originIata}
                  </div>
                  <div className="text-[10px] text-white/40 mt-0.5 tracking-wide">
                    {destination.trim() ? "Delhi, IN" : CAROUSEL_PASSES[carouselIndex].originCity}
                  </div>
                </div>
                <div className="flex-1 flex items-center justify-center px-3 relative">
                  <div
                    className="w-full h-px"
                    style={{ background: "repeating-linear-gradient(90deg, rgba(255,255,255,0.2) 0, rgba(255,255,255,0.2) 6px, transparent 6px, transparent 12px)" }}
                  />
                  <motion.span
                    animate={{ x: [-8, 8, -8] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute text-lg"
                    style={{ display: "inline-block", rotate: "-45deg" }}
                  >
                    ✈
                  </motion.span>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold tracking-tight text-sky-400">
                    {destination.trim() ? (destination.trim().split(" ")[0].slice(0, 3).toUpperCase()) : CAROUSEL_PASSES[carouselIndex].iata}
                  </div>
                  <div className="text-[10px] text-white/40 mt-0.5 tracking-wide truncate max-w-[80px]">
                    {destination.trim() ? destination.trim().split(" ")[0] : CAROUSEL_PASSES[carouselIndex].destination}
                  </div>
                </div>
              </motion.div>

              {/* Info grid */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                {(
                  [
                    { label: "Class", val: "Premium" },
                    { label: "Gate",  val: "A — 07"  },
                    { label: "Seat",  val: "07A"      },
                  ] as const
                ).map((item) => (
                  <div
                    key={item.label}
                    className="text-center p-3 rounded-xl"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
                  >
                    <div className="text-[10px] text-white/35 mb-1 tracking-wide">{item.label}</div>
                    <div className="text-sm font-semibold text-white/90">{item.val}</div>
                  </div>
                ))}
              </div>

              {/* Day strips */}
              <motion.div
                key={`days-${carouselIndex}`}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, ease: "easeOut", delay: 0.05 }}
                className="space-y-2 mb-4"
              >
                {(destination.trim()
                  ? [
                      { num: 1, title: `Arrival & ${destination.trim().split(" ")[0]} immersion`, sub: "Street food, temples, hidden alleys", chip: "Morning",   bg: "rgba(108,47,247,0.15)", border: "rgba(108,47,247,0.3)",  numBg: "rgba(108,47,247,0.5)", numColor: "#c4a8ff", chipBg: "rgba(108,47,247,0.3)",  chipColor: "#c4a8ff" },
                      { num: 2, title: `${destination.trim().split(" ")[0]} heritage walks`,   sub: "Art galleries, local museums",      chip: "Full day",  bg: "rgba(14,165,233,0.15)", border: "rgba(14,165,233,0.3)",  numBg: "rgba(14,165,233,0.5)", numColor: "#7dd3fc", chipBg: "rgba(14,165,233,0.3)",  chipColor: "#7dd3fc" },
                      { num: 3, title: `${destination.trim().split(" ")[0]} scenic escapes`,     sub: "Mountain views, local markets",     chip: "Adventure", bg: "rgba(16,185,129,0.12)", border: "rgba(16,185,129,0.25)", numBg: "rgba(16,185,129,0.4)", numColor: "#6ee7b7", chipBg: "rgba(16,185,129,0.25)", chipColor: "#6ee7b7" },
                    ]
                  : CAROUSEL_PASSES[carouselIndex].days
                ).map((day) => (
                  <div
                    key={day.num}
                    onClick={() => {
                      const activeQuery = destination.trim() ? destination : CAROUSEL_PASSES[carouselIndex].defaultQuery
                      handleSearch(activeQuery)
                    }}
                    className="flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-all hover:brightness-125 border border-transparent"
                    style={{ background: day.bg, borderColor: day.border }}
                  >
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
                      style={{ background: day.numBg, color: day.numColor }}
                    >
                      {day.num}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold text-white/90 truncate">{day.title}</div>
                      <div className="text-[10px] text-white/40 mt-0.5">{day.sub}</div>
                    </div>
                    <div
                      className="text-[10px] font-semibold px-2 py-1 rounded-full flex-shrink-0"
                      style={{ background: day.chipBg, color: day.chipColor }}
                    >
                      {day.chip}
                    </div>
                  </div>
                ))}
              </motion.div>

              {/* Action buttons */}
              <div className="flex gap-2 mb-2">
                <button
                  onClick={() => {
                    const activeQuery = destination.trim() ? destination : CAROUSEL_PASSES[carouselIndex].defaultQuery
                    handleSearch(activeQuery)
                  }}
                  className="flex-1 py-3 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-1.5 transition-all hover:brightness-110 active:scale-95"
                  style={{ background: "linear-gradient(135deg, #6c2ff7, #0ea5e9)", boxShadow: "0 0 20px rgba(108,47,247,0.4)", fontFamily: "inherit" }}
                >
                  ✨ Build Itinerary
                </button>
                <button
                  onClick={() => {
                    const activeQuery = destination.trim() ? destination : CAROUSEL_PASSES[carouselIndex].defaultQuery
                    handleSearch(activeQuery)
                  }}
                  className="flex-1 py-3 rounded-xl text-sm font-semibold transition-all hover:brightness-125 active:scale-95 text-white/85 hover:text-white"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", fontFamily: "inherit" }}
                >
                  🖨 Save Plan
                </button>
              </div>

              {/* Auto-scroll progress indicator bar */}
              {!destination.trim() && (
                <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-white/5 overflow-hidden">
                  <motion.div
                    key={carouselIndex}
                    initial={{ width: "0%" }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 5, ease: "linear" }}
                    className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-sky-400"
                    style={{ boxShadow: "0 0 8px rgba(108,47,247,0.8)" }}
                  />
                </div>
              )}
            </div>
          </motion.div>
        </section>

        {/* ── Destination cards ── */}
        <section className="max-w-6xl mx-auto px-6 md:px-8 pb-16">
          <div className="flex items-center gap-3 mb-5">
            <span className="text-[11px] font-semibold text-white/35 tracking-[2px] uppercase whitespace-nowrap">
              Trending escapes
            </span>
            <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.06)" }} />
            <span className="text-[11px] text-white/25 whitespace-nowrap">Click to configure</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {POPULAR_DESTINATIONS.map((dest) => {
              const c = DEST_COLORS[dest.color]
              return (
                <motion.div
                  key={dest.name}
                  whileHover={{ y: -6, scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => handleSearch(dest.name)}
                  className={`relative p-5 rounded-2xl border cursor-pointer transition-all overflow-hidden ${c.card} ${c.glow}`}
                  style={{ background: CARD_BG[dest.color] }}
                >
                  {/* Top shimmer */}
                  <div className={`absolute top-0 left-0 right-0 h-px bg-gradient-to-r ${c.topLine}`} />

                  <div className="text-3xl mb-3">{dest.emoji}</div>
                  <div className="font-semibold text-white/95 text-base mb-1">{dest.name}</div>
                  <div className="text-xs text-white/45 leading-relaxed mb-4">{dest.desc}</div>
                  <div className={`text-xs font-semibold flex items-center gap-1 ${c.cta}`}>
                    → Configure trip
                  </div>
                </motion.div>
              )
            })}
          </div>
        </section>

        {/* ── Footer ── */}
        <footer
          className="border-t py-8 text-center space-y-3"
          style={{ borderColor: "rgba(255,255,255,0.06)" }}
        >
          <div className="flex justify-center items-center gap-2">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-sm"
              style={{ background: "linear-gradient(135deg, #6c2ff7, #0ea5e9)" }}
            >
              🛫
            </div>
            <span className="font-semibold text-white/80">AeroVibe</span>
          </div>
          <p className="text-xs text-white/30">
            © {new Date().getFullYear()} AeroVibe Inc. Empowering global explorers through elegant spatial intelligence.
          </p>
        </footer>

      </div>{/* /z-10 wrapper */}
    </div>
  )
}
