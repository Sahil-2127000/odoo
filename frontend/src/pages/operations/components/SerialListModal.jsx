import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { getSerialItems } from '../../../api/operations'
import { useApiData } from '../useApiData'
import { formatDate, labelize, SERIAL_STATUS_TONE } from '../utils'
import { Badge, inputClass, Modal } from './ui'

const STATUSES = Object.keys(SERIAL_STATUS_TONE)

export default function SerialListModal({ open, product, onClose }) {
  const { data, loading, error } = useApiData(() => getSerialItems({ product: product._id }), product._id)
  const [status, setStatus] = useState('')
  const [q, setQ] = useState('')

  const counts = useMemo(() => Object.fromEntries(STATUSES.map((s) => [s, data?.filter((x) => x.status === s).length ?? 0])), [data])

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase()
    return (data ?? []).filter((s) => (!status || s.status === status) && (!term || s.serialNumber.toLowerCase().includes(term)))
  }, [data, status, q])

  return (
    <Modal open={open} title={`Serial numbers: ${product.name}`} onClose={onClose}>
      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setStatus('')}
            className={`rounded-full px-3 py-1 text-xs font-medium ${!status ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-700'}`}
          >
            All {data?.length ?? ''}
          </button>
          {STATUSES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatus(s)}
              className={`rounded-full px-3 py-1 text-xs font-medium ${status === s ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-700'}`}
            >
              {labelize(s)} {counts[s]}
            </button>
          ))}
        </div>

        <input className={inputClass} placeholder="Search serial number" value={q} onChange={(e) => setQ(e.target.value)} />

        {loading && <p className="text-sm text-slate-500">Loading...</p>}
        {error && <p className="text-sm text-red-600">Error: {error}</p>}

        {data && (
          <div className="max-h-[50vh] overflow-auto rounded-md border border-slate-200">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="sticky top-0 bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-3 py-2">Serial</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Customer / order</th>
                  <th className="px-3 py-2">Stocked in</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((s) => (
                  <tr key={s._id}>
                    <td className="whitespace-nowrap px-3 py-2">
                      <Link to={`/operations/serials/${encodeURIComponent(s.serialNumber)}`} className="font-mono text-xs text-amber-700 hover:underline">
                        {s.serialNumber}
                      </Link>
                    </td>
                    <td className="px-3 py-2">
                      <Badge tone={SERIAL_STATUS_TONE[s.status]}>{labelize(s.status)}</Badge>
                    </td>
                    <td className="px-3 py-2 text-slate-700">
                      {s.customer ? (
                        <>
                          {s.customer.name}
                          <span className="block text-xs text-slate-500">{s.order?.orderNumber}</span>
                        </>
                      ) : (
                        <span className="text-slate-400">{s.notes || '-'}</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 text-slate-600">{formatDate(s.stockInDate)}</td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-3 py-8 text-center text-slate-500">
                      No serials match.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Modal>
  )
}
