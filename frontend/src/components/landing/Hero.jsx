import SlabButton from './SlabButton'
import Reveal from './Reveal'
import { TICKER } from './landingData'

// Full-screen photo with the headline at the bottom (layout taken from the reference design).
export default function Hero() {
  return (
    <section className="relative isolate flex min-h-screen flex-col overflow-hidden bg-slate-950 text-white">
      {/* Background photo: frontend/public/solar-hero.jpg
          "Solar panels on a roof" by Soren H on Unsplash (free, Unsplash License) */}
      <img
        src="/solar-hero.jpg"
        alt="Rows of blue solar panels on a roof under a blue sky"
        className="absolute inset-0 -z-20 h-full w-full object-cover object-center"
      />

      {/* Two dark gradients so white text is readable: top + bottom, and from the left */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-slate-950/45 via-transparent to-slate-950/75" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-slate-950/50 via-transparent to-transparent" />

      {/* Content sits at the bottom of the screen */}
      <div className="mx-auto mt-auto flex w-full max-w-7xl flex-wrap items-end justify-between gap-x-10 gap-y-8 px-5 pt-32 pb-24 sm:px-8">
        {/* Left: big headline */}
        <Reveal>
          <h1 className="font-display text-[clamp(4rem,11vw,9.5rem)] leading-[0.86] font-extrabold text-white uppercase">
            Catch
            <br />
            the sun.
          </h1>
          <p className="mt-3 font-serif text-[clamp(2.5rem,6vw,5.5rem)] leading-none text-amber-300 italic">
            Cut your bill.
          </p>
        </Reveal>

        {/* Right: short text and buttons */}
        <Reveal delay={0.3} className="max-w-sm">
          <p className="text-lg font-semibold text-amber-300">PM Surya Ghar subsidy up to ₹78,000</p>
          <p className="mt-3 text-[17px] leading-relaxed text-white/90">
            SolarConnect installs rooftop solar for homes and small factories, from 1 kW to 5 kW. We do the roof
            survey, the subsidy paperwork, the installation and give you a 20-year warranty.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <SlabButton href="#enquiry">Get a free quote</SlabButton>
            <SlabButton to="/track" variant="outline">Track my order</SlabButton>
          </div>
        </Reveal>
      </div>

      {/* Numbers strip that scrolls sideways forever.
          The list is drawn twice so the loop has no gap. */}
      <div className="absolute inset-x-0 bottom-0 flex h-14 items-center overflow-hidden border-t border-white/20 bg-slate-950/40">
        <div className="flex w-max animate-marquee">
          {[...TICKER, ...TICKER].map((item, i) => (
            <span key={i} className="flex items-center gap-2 px-8 text-sm font-semibold whitespace-nowrap text-white/85">
              <span className="text-amber-300">{item.value}</span> {item.label}
              <span className="pl-8 text-white/30">/</span>
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}
