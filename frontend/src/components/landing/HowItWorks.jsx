import Reveal from './Reveal'
import { STEPS } from './landingData'

// Four steps: Enquiry -> Survey -> Install -> 20-year warranty
export default function HowItWorks() {
  return (
    <section id="how-it-works" className="scroll-mt-16 bg-amber-50 py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <Reveal className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="text-sm font-semibold text-primary-600">How it works</p>
            <h2 className="mt-2 font-display text-4xl font-extrabold tracking-tight sm:text-5xl">From enquiry to warranty</h2>
          </div>
          <p className="max-w-sm text-slate-600">
            Four simple steps. You always know what happens next, and you never have to chase anyone.
          </p>
        </Reveal>

        {/* A thick line on top, then the steps side by side */}
        <ol className="mt-14 grid border-t-2 border-slate-900 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, index) => (
            <li key={step.title} className="border-b border-slate-900/10 py-8 sm:pr-8 lg:border-b-0">
              <Reveal delay={index * 0.1}>
                <span className="font-display text-6xl font-extrabold text-primary-300">0{index + 1}</span>
                <h3 className="mt-4 text-xl font-bold">{step.title}</h3>
                <p className="mt-2 text-slate-600">{step.text}</p>
              </Reveal>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
