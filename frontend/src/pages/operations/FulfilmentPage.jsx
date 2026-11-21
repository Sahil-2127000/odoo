import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, CheckCircle2, PackageCheck } from 'lucide-react'
import { getOrdersToFulfil, getStockSummary } from '@/api/operations'
import { Badge, Button } from '@/components/ui'
import OpsPageShell, { ShellStatus, StatCard } from './components/OpsPageShell'
import ReserveOrderModal from './components/ReserveOrderModal'
import { useApiData } from './useApiData'
import { formatDate, formatINR, labelize } from './utils'

const loadData = async () => {
  const [orders, stock] = await Promise.all([getOrdersToFulfil({}), getStockSummary()])
  return { orders, stock }
}

const TABS = [
  { key: 'confirmed', label: 'Awaiting reservation' },
  { key: 'reserved', label: 'Reserved, ready to install' },
  { key: 'later', label: 'Scheduled / installed' },
]
const inTab = (order, tab) => (tab === 'later' ? ['installation_scheduled', 'installed'].includes(order.status) : order.status === tab)
const STATUS_TONE = { confirmed: 'amber', reserved: 'blue', installation_scheduled: 'purple', installed: 'green' }

// Lines whose free stock is lower than the quantity on the order.
const shortLines = (order, stock) =>
  order.items.filter((i) => (stock.find((r) => r.product._id === i.product._id)?.inStock ?? 0) < i.quantity)

function OrderCard({ order, stock, onReserve }) {
  const tracked = order.items.filter((i) => i.product.trackSerial)
  const serialUnits = tracked.reduce((n, i) => n + i.quantity, 0)
  const short = order.status === 'confirmed' ? shortLines(order, stock) : []

  return (
    <div className="flex flex-col rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-slate-900">{order.orderNumber}</p>
          <p className="text-xs text-slate-500">Ordered {formatDate(order.createdAt)}</p>
        </div>
        <Badge tone={STATUS_TONE[order.status]}>{labelize(order.status)}</Badge>
      </div>

      <div className="mt-3 text-sm">
        <p className="font-medium text-slate-900">{order.customer.name}</p>
        <p className="text-slate-500">{order.customer.phone}</p>
        <p className="text-slate-500">{order.customer.address}</p>
      </div>

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-700">
        <span>
          <span className="font-medium">{order.systemSizeKw} kW</span> {order.systemType === 'off_grid' ? 'Off-grid' : 'On-grid'}
        </span>
        <span>{order.items.length} lines</span>
        <span>{serialUnits} serial units</span>
        <span>{formatINR(order.totalAmount)}</span>
      </div>

      {order.status === 'confirmed' && (
        <p className={`mt-3 flex items-center gap-1.5 text-sm ${short.length ? 'text-red-600' : 'text-emerald-700'}`}>
          {short.length ? <AlertTriangle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
          {short.length ? `Short on ${short.map((s) => s.product.name).join(', ')}` : 'All items in stock'}
        </p>
      )}

      <div className="mt-4 flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
        {order.status === 'confirmed' && (
          <Button size="sm" icon={PackageCheck} onClick={() => onReserve(order)}>
            Reserve stock
          </Button>
        )}
        {order.status === 'reserved' && (
          <Link to="/operations/installations" className="text-sm font-medium text-amber-700 hover:underline">
            Next: schedule installation →
          </Link>
        )}
        {order.status !== 'confirmed' && order.status !== 'reserved' && <span className="text-xs text-slate-500">Stock already assigned</span>}
      </div>
    </div>
  )
}

export default function FulfilmentPage() {
  const { data, loading, error, reload } = useApiData(loadData)
  const [tab, setTab] = useState('confirmed')
  const [reserving, setReserving] = useState(null)

  const orders = data?.orders ?? []
  const count = (t) => orders.filter((o) => inTab(o, t)).length
  const visible = orders.filter((o) => inTab(o, tab))

  return (
    <OpsPageShell title="Orders to Fulfil" description="Confirmed orders need stock reserved before the crew can be scheduled. Pick the exact serial numbers that will go to each customer.">
      <ShellStatus loading={loading && !data} error={error}>
        {data && (
          <>
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <StatCard label="Awaiting reservation" value={count('confirmed')} tone="amber" />
              <StatCard label="Reserved, to schedule" value={count('reserved')} tone="blue" />
              <StatCard label="Scheduled / installed" value={count('later')} tone="green" />
            </div>

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

            {visible.length ? (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {visible.map((o) => (
                  <OrderCard key={o._id} order={o} stock={data.stock} onReserve={setReserving} />
                ))}
              </div>
            ) : (
              <p className="rounded-lg border border-dashed border-slate-300 bg-white px-4 py-10 text-center text-sm text-slate-500">
                {tab === 'confirmed' ? 'No orders waiting. New orders appear here when Sales accepts a quotation.' : 'Nothing here yet.'}
              </p>
            )}
          </>
        )}
      </ShellStatus>

      {reserving && (
        <ReserveOrderModal
          order={reserving}
          stockRows={data.stock}
          onClose={() => setReserving(null)}
          onReserved={() => {
            setReserving(null)
            setTab('reserved')
            reload()
          }}
        />
      )}
    </OpsPageShell>
  )
}
