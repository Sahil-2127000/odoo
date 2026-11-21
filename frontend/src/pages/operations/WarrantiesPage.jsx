import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { LifeBuoy, ScanSearch } from 'lucide-react'
import { getWarranties, PRODUCT_CATEGORIES } from '@/api/operations'
import { Badge } from '@/components/ui'
import OpsPageShell, { ShellStatus, StatCard } from './components/OpsPageShell'
import { inputClass } from './components/ui'
import { useApiData } from './useApiData'
import { formatDate, labelize, warrantyTimeLeft } from './utils'

const SOON_DAYS = 180
const DAY = 86400000

// active + ends within SOON_DAYS
const isExpiringSoon = (w) => w.status === 'active' && new Date(w.endDate) - Date.now() < SOON_DAYS * DAY

const TABS = [
  { key: '', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'soon', label: `Expiring in ${SOON_DAYS / 30} months` },
  { key: 'expired', label: 'Expired' },
]
const inTab = (w, tab) => (!tab ? true : tab === 'soon' ? isExpiringSoon(w) : w.status === tab)

// Active first (soonest expiry first, so they get attention), then expired (most recent first).
const sortWarranties = (list) =>
  [...list].sort((a, b) => {
    if (a.status !== b.status) return a.status === 'active' ? -1 : 1
    return a.status === 'active' ? a.endDate.localeCompare(b.endDate) : b.endDate.localeCompare(a.endDate)
  })

export default function WarrantiesPage() {
  const { data, loading, error } = useApiData(() => getWarranties())
  const [tab, setTab] = useState('')
  const [category, setCategory] = useState('')
  const [q, setQ] = useState('')

  const all = useMemo(() => sortWarranties(data ?? []), [data])
  const count = (t) => all.filter((w) => inTab(w, t)).length

  const visible = useMemo(() => {
    const term = q.trim().toLowerCase()
    return all.filter(
      (w) =>
        inTab(w, tab) &&
        (!category || w.product?.category === category) &&
        (!term || [w.serialNumber, w.customer?.name, w.customer?.phone, w.warrantyNumber].some((v) => v?.toLowerCase().includes(term))),
    )
  }, [all, tab, category, q])

  // Only offer categories that actually have warranties.
  const usedCategories = PRODUCT_CATEGORIES.filter((c) => all.some((w) => w.product?.category === c))

  return (
    <OpsPageShell
      title="Warranties"
      description="Every serial-numbered unit gets a warranty automatically when its installation is completed. The clock starts that day; nobody types dates."
    >
      <ShellStatus loading={loading && !data} error={error}>
        {data && (
          <>
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <StatCard label="Total warranties" value={all.length} />
              <StatCard label="Active" value={count('active')} tone="green" />
              <StatCard label={`Expiring in ${SOON_DAYS / 30} months`} value={count('soon')} tone="amber" />
              <StatCard label="Expired" value={count('expired')} tone="red" />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex flex-wrap gap-2">
                {TABS.map((t) => (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => setTab(t.key)}
                    className={`rounded-full px-3 py-1 text-xs font-medium ${tab === t.key ? 'bg-slate-800 text-white' : 'bg-white text-slate-700 ring-1 ring-slate-200'}`}
                  >
                    {t.label} {count(t.key)}
                  </button>
                ))}
              </div>
              <select className={`${inputClass} max-w-[180px]`} value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="">All products</option>
                {usedCategories.map((c) => (
                  <option key={c} value={c}>
                    {labelize(c)}
                  </option>
                ))}
              </select>
              <input
                className={`${inputClass} max-w-xs`}
                placeholder="Search serial, customer or phone"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>

            <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Serial / product</th>
                    <th className="px-4 py-3">Customer</th>
                    <th className="px-4 py-3">Start</th>
                    <th className="px-4 py-3">End</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {visible.map((w) => {
                    const soon = isExpiringSoon(w)
                    return (
                      <tr key={w._id}>
                        <td className="px-4 py-3">
                          <Link to={`/operations/serials/${encodeURIComponent(w.serialNumber)}`} className="font-mono text-xs text-amber-700 hover:underline">
                            {w.serialNumber}
                          </Link>
                          <p className="text-xs text-slate-500">
                            {w.product?.name} · {w.warrantyNumber}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-slate-900">{w.customer?.name}</p>
                          <p className="text-xs text-slate-500">
                            {w.customer?.phone} · {w.order?.orderNumber}
                          </p>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-slate-700">{formatDate(w.startDate)}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-slate-700">{formatDate(w.endDate)}</td>
                        <td className="px-4 py-3">
                          <Badge tone={w.status === 'expired' ? 'red' : soon ? 'amber' : 'green'}>
                            {w.status === 'expired' ? 'Expired' : soon ? 'Expiring soon' : 'Active'}
                          </Badge>
                          <p className="mt-1 text-xs text-slate-500">{warrantyTimeLeft(w.endDate)}</p>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-right">
                          <div className="flex justify-end gap-3 text-xs font-medium">
                            <Link
                              to={`/operations/serials/${encodeURIComponent(w.serialNumber)}`}
                              className="inline-flex items-center gap-1 text-slate-600 hover:text-slate-900"
                            >
                              <ScanSearch className="h-3.5 w-3.5" /> Trace
                            </Link>
                            <Link
                              to={`/operations/tickets?serial=${encodeURIComponent(w.serialNumber)}`}
                              className="inline-flex items-center gap-1 text-amber-700 hover:text-amber-900"
                            >
                              <LifeBuoy className="h-3.5 w-3.5" /> Raise ticket
                            </Link>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                  {visible.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-10 text-center text-sm text-slate-500">
                        No warranties match.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </ShellStatus>
    </OpsPageShell>
  )
}
