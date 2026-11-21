import { ShieldCheck } from 'lucide-react'
import Reveal from './Reveal'
import { SUBSIDY, TRUST_POINTS } from './landingData'

// Left: government subsidy note. Right: why customers can trust us.
export default function SubsidyAndTrust() {
  return (
    <section id="subsidy" className="scroll-mt-16 bg-white py-24">
      <div className="mx-auto grid max-w-6xl gap-16 px-4 sm:px-6 lg:grid-cols-2">
        {/* Subsidy note */}
        <Reveal>
          <p className="text-sm font-semibold text-primary-600">Government subsidy</p>
          <h2 className="mt-2 font-display text-4xl font-extrabold tracking-tight sm:text-5xl">Up to ₹78,000 back</h2>
          <p className="mt-4 text-slate-600">
            Under the PM Surya Ghar scheme, the subsidy is paid straight into your bank account for
            on-grid home systems. We fill in the forms and follow up for you.
          </p>

          <table className="mt-8 w-full text-left">
            <thead>
              <tr className="border-b-2 border-slate-900 text-sm text-slate-500">
                <th className="py-3 font-medium">System size</th>
                <th className="py-3 text-right font-medium">Subsidy</th>
              </tr>
            </thead>
            <tbody>
              {SUBSIDY.map((row) => (
                <tr key={row.size} className="border-b border-slate-200">
                  <td className="py-4 font-medium text-slate-900">{row.size}</td>
                  <td className="py-4 text-right text-2xl font-bold text-success-700">{row.amount}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-3 text-xs text-slate-500">Subsidy amounts as per current government rules. Off-grid systems are not covered.</p>
        </Reveal>

        {/* Trust points */}
        <Reveal delay={0.15} className="bg-slate-950 p-8 text-white sm:p-10">
          <h3 className="font-display text-2xl font-bold text-white">Why homeowners choose us</h3>
          <ul className="mt-8 space-y-6">
            {TRUST_POINTS.map((point) => (
              <li key={point.title} className="flex gap-4">
                <ShieldCheck className="h-6 w-6 shrink-0 text-amber-300" />
                <div>
                  <p className="font-semibold">{point.title}</p>
                  <p className="mt-1 text-sm text-slate-400">{point.text}</p>
                </div>
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  )
}
