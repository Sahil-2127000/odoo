import { useEffect, useState } from 'react'
import { CheckCircle2 } from 'lucide-react'
import { getPublicKits } from '@/api/public'
import { formatCurrency } from '@/utils/format'
import Reveal from './Reveal'
import { SYSTEM_TYPES } from './landingData'

/**
 * Shows the 1–5 kW kits from GET /public/kits.
 * onSelect(kit) is called when the visitor clicks "Get quote for this".
 */
export default function Packages({ onSelect }) {
  const [kits, setKits] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [type, setType] = useState('on_grid') // which tab is open

  // Load the kits once when the page opens
  useEffect(() => {
    getPublicKits()
      .then((data) => setKits(data || []))
      .catch(() => setError('Could not load packages. Please try again later.'))
      .finally(() => setLoading(false))
  }, [])

  const visibleKits = kits.filter((kit) => kit.type === type)

  return (
    <section id="packages" className="scroll-mt-16 bg-white py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* Heading + On-Grid / Off-Grid switch */}
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="text-sm font-semibold text-primary-600">Packages</p>
            <h2 className="mt-2 font-display text-5xl leading-[0.9] font-extrabold uppercase sm:text-7xl">Pick your system size</h2>
            <p className="mt-3 max-w-lg text-slate-600">
              Ready-made kits with every part included. On-Grid prices are shown after the government subsidy.
            </p>
          </div>

          <div className="flex border border-slate-300">
            {SYSTEM_TYPES.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setType(option.value)}
                className={`px-4 py-2.5 text-sm font-semibold ${
                  type === option.value ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {option.value === 'on_grid' ? 'On-Grid' : 'Off-Grid'}
              </button>
            ))}
          </div>
        </div>

        {/* Loading / error / empty states */}
        {loading && <p className="mt-12 text-slate-500">Loading packages…</p>}
        {error && <p className="mt-12 text-danger-700">{error}</p>}
        {!loading && !error && visibleKits.length === 0 && (
          <p className="mt-12 text-slate-500">No packages available right now.</p>
        )}

        {/* Kit cards */}
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {visibleKits.map((kit, index) => (
            <Reveal key={kit.id} delay={index * 0.08} className="flex">
              <KitCard kit={kit} onSelect={onSelect} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

function KitCard({ kit, onSelect }) {
  return (
    <div
      className={`relative flex w-full flex-col border bg-white p-7 transition hover:-translate-y-1 hover:shadow-xl ${
        kit.popular ? 'border-primary-500' : 'border-slate-200'
      }`}
    >
      {kit.popular && (
        <span className="absolute top-7 right-7 bg-amber-300 px-2 py-1 text-xs font-bold text-slate-900">
          Most popular
        </span>
      )}

      <p className="font-display text-7xl font-extrabold text-slate-900">
        {kit.capacityKw}
        <span className="ml-1 text-xl text-slate-400">kW</span>
      </p>
      <p className="mt-1 text-sm font-medium text-slate-500">
        {kit.type === 'on_grid' ? 'On-Grid' : 'Off-Grid'} system
      </p>

      <p className="mt-6 text-sm text-slate-500">Starting at</p>
      <p className="text-3xl font-bold text-slate-900">{formatCurrency(kit.netPrice)}</p>
      {kit.subsidy > 0 ? (
        <p className="text-sm text-success-700">
          after {formatCurrency(kit.subsidy)} subsidy{' '}
          <span className="text-slate-400 line-through">{formatCurrency(kit.price)}</span>
        </p>
      ) : (
        <p className="text-sm text-slate-500">includes battery backup</p>
      )}

      <ul className="mt-6 flex-1 space-y-2 text-sm text-slate-600">
        <Spec>{kit.panelsCount} solar panels</Spec>
        <Spec>{kit.inverterType}</Spec>
        {kit.battery && <Spec>{kit.battery}</Spec>}
        <Spec>Needs about {kit.roofAreaRequired} of roof</Spec>
        <Spec>Saves about {formatCurrency(kit.monthlySavings)} a month</Spec>
      </ul>

      <button
        type="button"
        onClick={() => onSelect(kit)}
        className="mt-7 h-11 border border-slate-900 text-sm font-semibold text-slate-900 hover:bg-slate-900 hover:text-white"
      >
        Get quote for this →
      </button>
    </div>
  )
}

function Spec({ children }) {
  return (
    <li className="flex gap-2">
      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success-500" />
      <span>{children}</span>
    </li>
  )
}
