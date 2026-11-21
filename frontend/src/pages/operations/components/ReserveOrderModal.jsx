import { useState } from 'react'
import { CheckCircle2, Wand2 } from 'lucide-react'
import { getSerialItems, reserveOrder } from '@/api/operations'
import { Badge, Button, Modal, useToast } from '@/components/ui'
import { useApiData } from '../useApiData'

// Loads free (in_stock) serials for every serial-tracked product on the order: { [productId]: serial[] }
const loadFreeSerials = async (order) => {
  const tracked = order.items.filter((i) => i.product.trackSerial)
  const lists = await Promise.all(tracked.map((i) => getSerialItems({ product: i.product._id, status: 'in_stock' })))
  return Object.fromEntries(tracked.map((i, idx) => [i.product._id, lists[idx]]))
}

function SerialLine({ line, free, picked, onToggle, onAuto, onClear }) {
  const [q, setQ] = useState('')
  const need = line.quantity
  const done = picked.length === need
  const shown = free.filter((s) => !q || s.serialNumber.toLowerCase().includes(q.trim().toLowerCase()))

  return (
    <div className={`rounded-lg border p-3 ${done ? 'border-emerald-300 bg-emerald-50/40' : 'border-slate-200'}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="font-medium text-slate-900">
            {line.product.name} <span className="text-slate-500">× {need}</span>
          </p>
          <p className="text-xs text-slate-500">
            Picked <span className={done ? 'font-semibold text-emerald-700' : 'font-semibold text-slate-900'}>{picked.length}</span> of {need} ·{' '}
            {free.length} free in warehouse
          </p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="secondary" onClick={onAuto} disabled={free.length < need}>
            Auto-pick
          </Button>
          {picked.length > 0 && (
            <Button size="sm" variant="ghost" onClick={onClear}>
              Clear
            </Button>
          )}
        </div>
      </div>

      {free.length < need ? (
        <p className="mt-2 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          Not enough stock: need {need}, only {free.length} free. Stock in more from the Inventory page.
        </p>
      ) : (
        <>
          {free.length > 8 && (
            <input
              className="mt-2 w-full rounded-md border border-slate-300 px-2 py-1 font-mono text-xs"
              placeholder="Filter serials"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          )}
          <div className="mt-2 grid max-h-40 grid-cols-2 gap-1 overflow-y-auto sm:grid-cols-3">
            {shown.map((s) => {
              const on = picked.includes(s._id)
              const full = !on && picked.length >= need
              return (
                <label
                  key={s._id}
                  className={`flex cursor-pointer items-center gap-2 rounded px-2 py-1 font-mono text-xs ${
                    on ? 'bg-amber-100 text-amber-900' : full ? 'cursor-not-allowed text-slate-300' : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <input type="checkbox" className="accent-amber-500" checked={on} disabled={full} onChange={() => onToggle(s._id)} />
                  {s.serialNumber}
                </label>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}

// stockRows = getStockSummary() rows, used for quantity-only lines (cables, structures, ...).
export default function ReserveOrderModal({ order, stockRows, onClose, onReserved }) {
  const toast = useToast()
  const { data: freeByProduct, loading, error } = useApiData(() => loadFreeSerials(order), order._id)
  const [picked, setPicked] = useState({}) // { productId: [serialId] }
  const [saving, setSaving] = useState(false)

  const tracked = order.items.filter((i) => i.product.trackSerial)
  const bulk = order.items.filter((i) => !i.product.trackSerial)
  const stockOf = (productId) => stockRows.find((r) => r.product._id === productId)?.inStock ?? 0

  const pickedFor = (id) => picked[id] ?? []
  const toggle = (id, serialId) =>
    setPicked((p) => {
      const cur = p[id] ?? []
      return { ...p, [id]: cur.includes(serialId) ? cur.filter((x) => x !== serialId) : [...cur, serialId] }
    })
  const autoPick = (line) => setPicked((p) => ({ ...p, [line.product._id]: freeByProduct[line.product._id].slice(0, line.quantity).map((s) => s._id) }))
  const autoPickAll = () => tracked.forEach((line) => freeByProduct[line.product._id].length >= line.quantity && autoPick(line))

  // Cheap to compute on every render (a handful of lines).
  const totalPicked = tracked.reduce((n, l) => n + pickedFor(l.product._id).length, 0)
  const totalNeeded = tracked.reduce((n, l) => n + l.quantity, 0)
  const serialsDone = tracked.every((l) => pickedFor(l.product._id).length === l.quantity)
  const bulkShort = bulk.filter((l) => stockOf(l.product._id) < l.quantity)
  const status = { totalPicked, totalNeeded, ready: serialsDone && bulkShort.length === 0 }

  const submit = async () => {
    setSaving(true)
    try {
      const allocations = tracked.map((l) => ({ product: l.product._id, serialItems: pickedFor(l.product._id) }))
      await reserveOrder(order._id, allocations)
      toast.success(`${order.orderNumber} reserved: ${status.totalPicked} serial(s) assigned to ${order.customer.name}`)
      onReserved()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open
      size="xl"
      onClose={onClose}
      title={`Reserve stock for ${order.orderNumber}`}
      description={`${order.customer.name} · ${order.systemSizeKw} kW ${order.systemType === 'off_grid' ? 'Off-grid' : 'On-grid'} system`}
      footer={
        <>
          <span className="mr-auto self-center text-sm text-slate-600">
            {status.ready ? (
              <span className="inline-flex items-center gap-1 font-medium text-emerald-700">
                <CheckCircle2 className="h-4 w-4" /> Ready to reserve
              </span>
            ) : (
              `Serials picked ${status.totalPicked} / ${status.totalNeeded}`
            )}
          </span>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={!status.ready} loading={saving}>
            Reserve stock
          </Button>
        </>
      }
    >
      {loading && <p className="text-sm text-slate-500">Loading free stock...</p>}
      {error && <p className="text-sm text-red-600">Error: {error}</p>}
      {freeByProduct && (
        <div className="space-y-5">
          <section>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900">Serial-numbered items ({tracked.length})</h3>
              <Button size="sm" variant="secondary" icon={Wand2} onClick={autoPickAll}>
                Auto-pick all
              </Button>
            </div>
            <p className="mb-3 text-xs text-slate-500">
              Each unit leaving the warehouse is tied to this customer by its serial number. Warranty starts on these serials when the installation is completed.
            </p>
            <div className="space-y-3">
              {tracked.map((line) => (
                <SerialLine
                  key={line.product._id}
                  line={line}
                  free={freeByProduct[line.product._id]}
                  picked={pickedFor(line.product._id)}
                  onToggle={(sid) => toggle(line.product._id, sid)}
                  onAuto={() => autoPick(line)}
                  onClear={() => setPicked((p) => ({ ...p, [line.product._id]: [] }))}
                />
              ))}
            </div>
          </section>

          <section>
            <h3 className="mb-2 text-sm font-semibold text-slate-900">Bulk items ({bulk.length}): deducted from stock automatically</h3>
            <div className="overflow-hidden rounded-lg border border-slate-200">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-3 py-2">Item</th>
                    <th className="px-3 py-2 text-right">Needed</th>
                    <th className="px-3 py-2 text-right">In stock</th>
                    <th className="px-3 py-2" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {bulk.map((l) => {
                    const have = stockOf(l.product._id)
                    const ok = have >= l.quantity
                    return (
                      <tr key={l.product._id}>
                        <td className="px-3 py-2 text-slate-800">{l.product.name}</td>
                        <td className="px-3 py-2 text-right">{l.quantity}</td>
                        <td className={`px-3 py-2 text-right ${ok ? 'text-slate-700' : 'font-semibold text-red-600'}`}>{have}</td>
                        <td className="px-3 py-2 text-right">
                          <Badge tone={ok ? 'green' : 'red'}>{ok ? 'OK' : 'Short'}</Badge>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}
    </Modal>
  )
}
