// Orders list: confirmed orders from accepted quotations, payment progress, record payment.
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import PageShell from './PageShell'
import { Button, Table, Badge, Input, Select, Card } from './ui'
import RecordPaymentModal from './RecordPaymentModal'
import { ordersApi } from '@/api/sales'
import { formatCurrency, formatDate, listFrom, systemTypeLabel } from './salesHelpers'

const PAYMENT_FILTER = [
  { value: 'all', label: 'All payment states' },
  { value: 'pending', label: 'Pending' },
  { value: 'partial', label: 'Partially paid' },
  { value: 'paid', label: 'Paid' },
]

const STATUS_FILTER = [
  { value: 'all', label: 'All order states' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'inventory_reserved', label: 'Inventory reserved' },
  { value: 'installation_scheduled', label: 'Installation scheduled' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
]

export function PaymentProgress({ order }) {
  const pct = order.totalAmount ? Math.min(100, Math.round((order.paidAmount / order.totalAmount) * 100)) : 0
  return (
    <div className="w-32">
      <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
        <div className={`h-full rounded-full ${pct >= 100 ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ width: `${pct}%` }} />
      </div>
      <div className="mt-1 text-[11px] text-slate-400">{pct}% collected</div>
    </div>
  )
}

export default function OrdersPage() {
  const navigate = useNavigate()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [payFilter, setPayFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [payOrder, setPayOrder] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    const res = await ordersApi.getOrders()
    setOrders(listFrom(res))
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return orders.filter(
      (o) =>
        (payFilter === 'all' || o.paymentStatus === payFilter) &&
        (statusFilter === 'all' || o.status === statusFilter) &&
        (!q || o.orderNumber?.toLowerCase().includes(q) || o.customerName?.toLowerCase().includes(q) || o.quotationNumber?.toLowerCase().includes(q)),
    )
  }, [orders, search, payFilter, statusFilter])

  const totals = useMemo(
    () => ({
      booked: orders.reduce((s, o) => s + (o.totalAmount || 0), 0),
      collected: orders.reduce((s, o) => s + (o.paidAmount || 0), 0),
      outstanding: orders.reduce((s, o) => s + (o.balanceAmount || 0), 0),
    }),
    [orders],
  )

  const columns = [
    {
      key: 'orderNumber',
      title: 'Order',
      render: (v, row) => (
        <div>
          <div className="font-semibold text-slate-900">{v}</div>
          <div className="text-xs text-slate-400">{formatDate(row.createdAt)} · from {row.quotationNumber}</div>
        </div>
      ),
    },
    {
      key: 'customerName',
      title: 'Customer',
      render: (v, row) => (
        <div>
          <Link to={`/sales/customers/${row.customerId}`} onClick={(e) => e.stopPropagation()} className="font-medium text-slate-800 hover:text-amber-700">{v}</Link>
          <div className="text-xs text-slate-400">{row.customerCity || '—'}</div>
        </div>
      ),
    },
    { key: 'systemCapacityKw', title: 'System', render: (v, row) => `${v} kW ${systemTypeLabel(row.systemType)}` },
    { key: 'totalAmount', title: 'Total', align: 'right', render: (v) => <span className="font-semibold">{formatCurrency(v)}</span> },
    { key: 'balanceAmount', title: 'Balance', align: 'right', render: (v) => <span className={v > 0 ? 'font-semibold text-rose-700' : 'text-emerald-700'}>{formatCurrency(v)}</span> },
    { key: 'paidAmount', title: 'Collected', render: (_, row) => <PaymentProgress order={row} /> },
    {
      key: 'status',
      title: 'Status',
      render: (v, row) => (
        <div className="flex flex-col items-start gap-1">
          <Badge statusKey={v} size="sm">{v}</Badge>
          <Badge statusKey={row.paymentStatus} size="sm">{row.paymentStatus}</Badge>
        </div>
      ),
    },
    {
      key: 'actions',
      title: '',
      align: 'right',
      render: (_, row) =>
        row.balanceAmount > 0 ? (
          <Button size="sm" variant="success" onClick={(e) => { e.stopPropagation(); setPayOrder(row) }}>
            Record payment
          </Button>
        ) : null,
    },
  ]

  return (
    <PageShell title="Orders" subtitle="Confirmed orders created from accepted quotations." breadcrumbs={[{ label: 'Orders' }]}>
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card bodyClassName="p-4">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Booked ({orders.length} orders)</div>
          <div className="mt-1 text-2xl font-bold text-slate-900">{formatCurrency(totals.booked)}</div>
        </Card>
        <Card bodyClassName="p-4">
          <div className="text-xs font-semibold uppercase tracking-wider text-emerald-600">Collected</div>
          <div className="mt-1 text-2xl font-bold text-slate-900">{formatCurrency(totals.collected)}</div>
        </Card>
        <Card bodyClassName="p-4">
          <div className="text-xs font-semibold uppercase tracking-wider text-rose-600">Outstanding</div>
          <div className="mt-1 text-2xl font-bold text-slate-900">{formatCurrency(totals.outstanding)}</div>
        </Card>
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <Input name="search" placeholder="Search order, quote or customer..." value={search} onChange={(e) => setSearch(e.target.value)} className="sm:max-w-sm" />
        <Select name="payFilter" value={payFilter} onChange={(e) => setPayFilter(e.target.value)} options={PAYMENT_FILTER} className="sm:max-w-[200px]" />
        <Select name="statusFilter" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} options={STATUS_FILTER} className="sm:max-w-[220px]" />
      </div>

      <Table
        columns={columns}
        data={filtered}
        isLoading={loading}
        onRowClick={(row) => navigate(`/sales/orders/${row.id}`)}
        emptyMessage={orders.length ? 'No orders match your filters' : 'No orders yet. Accept a quotation to create one.'}
      />

      <RecordPaymentModal isOpen={!!payOrder} order={payOrder} onClose={() => setPayOrder(null)} onRecorded={load} />
    </PageShell>
  )
}
