import { useState } from 'react'
import SlabButton from './SlabButton'
import Reveal from './Reveal'
import { HERO_STATS } from './landingData'

// Put a rooftop solar photo at frontend/public/solar-hero.jpg to show it behind the text.
// Until then, a drawn solar panel is shown on the right side instead.
const HERO_PHOTO = '/solar-hero.jpg'

export default function Hero() {
  const [hasPhoto, setHasPhoto] = useState(true)

  return (
    <section className="relative flex min-h-screen flex-col overflow-hidden bg-slate-950 text-white">
      {/* Background photo. If the file is missing, we hide it and show the drawn panel. */}
      {hasPhoto && (
        <img
          src={HERO_PHOTO}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          onError={() => setHasPhoto(false)}
        />
      )}

      {/* Dark overlay + warm "sun" glow so the text is always readable */}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/50 to-slate-950/70" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_15%,rgba(249,115,22,0.4),transparent_45%)]" />

      {!hasPhoto && <SolarPanelDrawing />}

      {/* Headline and buttons, sitting near the bottom of the screen */}
      <div className="relative mx-auto mt-auto w-full max-w-6xl px-4 pt-32 pb-16 sm:px-6">
        <Reveal>
          <p className="inline-block border border-amber-300/40 bg-amber-300/10 px-3 py-1 text-sm font-semibold text-amber-300">
            PM Surya Ghar subsidy up to ₹78,000
          </p>
        </Reveal>

        <Reveal delay={0.1}>
          <h1 className="mt-5 max-w-3xl font-display text-5xl leading-[1.02] font-extrabold tracking-tight text-white sm:text-7xl">
            Free power from <span className="text-amber-300">your own roof.</span>
          </h1>
        </Reveal>

        <Reveal delay={0.2}>
          <p className="mt-6 max-w-xl text-lg text-slate-300">
            Rooftop solar for homes and small factories, from 1 kW to 5 kW. We handle the survey, the
            subsidy paperwork, installation and a 20-year warranty.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <SlabButton href="#enquiry">Get a free quote</SlabButton>
            <SlabButton to="/track" variant="outline">Track my order</SlabButton>
          </div>
        </Reveal>
      </div>

      {/* Strip of numbers at the very bottom */}
      <div className="relative border-t border-white/15 bg-slate-950/60">
        <dl className="mx-auto grid max-w-6xl grid-cols-2 px-4 sm:px-6 lg:grid-cols-4">
          {HERO_STATS.map((stat) => (
            <div key={stat.label} className="py-5">
              <dt className="font-display text-2xl font-bold text-white">{stat.value}</dt>
              <dd className="text-sm text-slate-400">{stat.label}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}

// A simple solar panel made of a grid of blue cells, tilted in 3D. Only on large screens.
function SolarPanelDrawing() {
  const cells = Array.from({ length: 24 }) // 6 columns x 4 rows

  return (
    <div className="pointer-events-none absolute top-24 right-[5%] hidden xl:block">
      <div
        className="grid w-[380px] grid-cols-6 gap-1 border-4 border-slate-400/70 bg-slate-300/60 p-1 shadow-2xl shadow-orange-500/20"
        style={{ transform: 'perspective(900px) rotateX(35deg) rotateZ(-12deg)' }}
      >
        {cells.map((_, i) => (
          <div key={i} className="aspect-square bg-gradient-to-br from-blue-600 via-blue-900 to-slate-900" />
        ))}
      </div>
    </div>
  )
}
