# 🛫 AeroVibe — Premium AI Travel Concierge

AeroVibe is a next-generation, high-fidelity AI-powered travel planning dashboard. Built using **Next.js 16 (App Router)**, **React 19**, **Tailwind CSS v4**, and **Framer Motion**, it delivers an immersive, glassmorphic digital brochure experience. AeroVibe utilizes **Google Gemini AI (via `gemini-3.5-flash`)** to craft highly personalized, detailed, multi-day itineraries dynamically converted to Indian Rupees (₹), complete with boutique stays, culinary secrets, and local insights.

---

## 🌟 Key Features

### 🌌 Immersive Cinematic Interface
* **Cursor-Reactive Starfield:** An interactive HTML5 Canvas background where stars gently warp and track the user's cursor movements.
* **Dynamic Aurora Blobs:** Multi-colored glowing radial blobs that float gracefully to simulate northern lights/auroras.
* **Boarding Pass Carousel:** A cycling showcase of popular destinations (Kyoto, Bali, Reykjavik, Amalfi Coast) that visualizes realistic flight details, ticket designs, and preview daily timelines.

### 🧠 Intelligent Conversational Routing
* **Greeting Detection:** Instantly detects greeting keywords (`who are you`, `tell me about yourself`, `hi`) to open a dedicated **AeroVibe AI Concierge Welcome Panel**.
* **Interactive Concept Guide:** Features a customized 3-day guide detailing how the application works, its features, and design guidelines.

### 📅 Rich Multi-Tab Results Dashboard
* **Day-by-Day (📅):** Sequential timelines mapped to Morning, Afternoon, and Evening slots. Features interactive accordion cards revealing local tips, attire recommendations, estimated durations, and cost estimates.
* **Boutique Stays (🏨):** Curated luxury, traditional, or eco-chic stays with localized descriptions, vibe ratings, and night rates.
* **Culinary Secrets (🍜):** Handpicked regional delicacies, recommended dining markets/restaurants, and sensory flavor profiles.
* **Local Insights (💡):** Critical safety guidelines, etiquette advice, and regional navigation tips.

### 🖨️ Professional Physical Printing
* **Ink-Friendly Layouts:** Custom CSS `@media print` rules hide complex gradients, animations, and dark background fills.
* **High-Contrast Typography:** Seamlessly styles high-fidelity brochures for physical printouts without broken page boundaries or overlapping cards.

### ⚡ Smart Fail-safe Fallbacks
* **Procedural Generator:** Automatically runs a high-quality procedurally customized multi-day database fallback if the Gemini API Key is missing or quota-limited, ensuring 100% uptime.
* **Currency Normalizer:** Dynamically catches, parses, and converts all pricing (from stays to food) into Indian Rupees (₹).

---

## 🛠️ Technical Stack

* **Framework:** Next.js 16 (App Router)
* **Language:** TypeScript
* **Frontend Library:** React 19
* **Styling:** Tailwind CSS v4 & Vanilla CSS
* **Animations:** Framer Motion
* **Core AI Engine:** Google Generative AI (`@google/generative-ai` with `gemini-3.5-flash`)

---

## 📁 Project Structure

```text
├── app/
│   ├── api/
│   │   └── travel/
│   │       └── route.ts         # Google Gemini Integration & Query Parser
│   ├── favicon.ico
│   ├── globals.css              # Custom scrollbars, font bindings, and global utilities
│   ├── layout.tsx               # High-contrast font loader & HTML Wrapper
│   └── page.tsx                 # Core Dashboard containing tabs & star field
├── components/
│   ├── AeroVibeHero.tsx        # High-fidelity landing page & Boarding Pass Carousel
│   └── ui/                     # Shadcn / customized component primitives
├── package.json
└── tsconfig.json
```

---

## 🚀 Getting Started

### Prerequisites

* **Node.js** (v18.x or higher)
* **npm** or **yarn** / **pnpm**
* A **Google Gemini API Key** (Get one from [Google AI Studio](https://aistudio.google.com/))

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/ChandanaCS13/AI-Travel-Planner.git
   cd AI-Travel-Planner
   ```

2. Install the dependencies:
   ```bash
   npm install
   ```

3. Configure your environment variables. Create a `.env.local` file in the root directory:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

---

## 📄 License

This project is private and proprietary. All rights reserved.
