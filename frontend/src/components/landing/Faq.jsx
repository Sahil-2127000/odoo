import { Plus } from 'lucide-react'
import Reveal from './Reveal'
import { FAQS } from './landingData'

// Short list of questions. <details> opens and closes by itself, no state needed.
export default function Faq() {
  return (
    <section id="faq" className="scroll-mt-16 bg-amber-50 py-24">
      <div className="mx-auto grid max-w-6xl gap-12 px-4 sm:px-6 lg:grid-cols-[1fr_1.4fr]">
        <Reveal>
          <p className="text-sm font-semibold text-primary-600">FAQ</p>
          <h2 className="mt-2 font-display text-4xl font-extrabold tracking-tight sm:text-5xl">Questions people ask</h2>
          <p className="mt-4 max-w-sm text-slate-600">Still not sure? Send an enquiry below and we will call you.</p>
        </Reveal>

        <Reveal delay={0.1} className="border-t-2 border-slate-900">
          {FAQS.map((item, index) => (
            <details key={item.q} open={index === 0} className="group border-b border-slate-900/15">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-5 text-lg font-semibold text-slate-900">
                {item.q}
                <Plus className="h-5 w-5 shrink-0 text-primary-500 transition-transform group-open:rotate-45" />
              </summary>
              <p className="pb-5 text-slate-600">{item.a}</p>
            </details>
          ))}
        </Reveal>
      </div>
    </section>
  )
}
