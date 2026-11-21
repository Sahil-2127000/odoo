// Payments: every receipt collected, totals by mode, outstanding balances, record new payment.
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import PageShell from './PageShell'
import { Button, Table, Input, Select, Card } from './ui'
import RecordPaymentModal from './RecordPaymentModal'
import { paymentsApi, ordersApi } from '@/api/sales'
import { PAYMENT_MODES, formatCurrency, formatDate, listFrom, modeLabel } from './salesHelpers'

export default function PaymentsPage() {
  const [payments, setPayments] = useState([])
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [mode, setMode] = useState('all')
  const [open, setOpen] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const [p, o] = await Promise.all([paymentsApi.getPayments(), ordersApi.getOrders()])
    setPayments(listFrom(p).sort((a, b) => new Date(b.date) - new Date(a.date)))
    setOrders(listFrom(o))
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return payments.filter(
      (p) =>
        (mode === 'all' || p.mode === mode) &&
        (!q || p.customerName?.toLowerCase().includes(q) || p.orderNumber?.toLowerCase().includes(q) || p.reference?.toLowerCase().includes(q)),
    )
  }, [payments, search, mode])

  const stats = useMemo(() => {
    const collected = payments.reduce((s, p) => s + (p.amount || 0), 0)
    const outstanding = orders.reduce((s, o) => s + (o.balanceAmount || 0), 0)
    const thisMonth = payments
      .filter((p) => {
        const d = new Date(p.date)
        const now = new Date()
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
      })
      .reduce((s, p) => s + (p.amount || 0), 0)
    const byMode = PAYMENT_MODES.map((m) => ({
      ...m,
      total: payments.filter((p) => p.mode === m.value).reduce((s, p) => s + (p.amount || 0), 0),
    })).filter((m) => m.total > 0)
    return { collected, outstanding, thisMonth, byMode }
  }, [payments, orders])

  const dueOrders = orders.filter((o) => o.balanceAmount > 0)

  const columns = [
    { key: 'date', title: 'Date', render: (v) => formatDate(v) },
    {
      key: 'customerName',
      title: 'Customer',
      render: (v, row) => (
        <Link to={`/sales/customers/${row.customerId}`} className="font-medium text-slate-800 hover:text-amber-700">{v}</Link>
      ),
    },
    {
      key: 'orderNumber',
      title: 'Order',
      render: (v, row) => (
        <Link to={`/sales/orders/${row.orderId}`} className="font-semibold text-amber-700 hover:underline">{v}</Link>
      ),
    },
    { key: 'amount', title: 'Amount', align: 'right', render: (v) => <span className="font-semibold text-emerald-700">{formatCurrency(v)}</span> },
    { key: 'mode', title: 'Mode', render: (v) => modeLabel(v) },
    { key: 'reference', title: 'Reference', render: (v) => <span className="font-mono text-xs">{v || '—'}</span> },
    { key: 'notes', title: 'Notes', render: (v) => <span className="text-xs text-slate-500">{v || '—'}</span> },
  ]

  return (
    <PageShell
      title="Payments"
      subtitle="Advance and instalment receipts collected against orders."
      breadcrumbs={[{ label: 'Payments' }]}
      actions={<Button variant="success" onClick={() => setOpen(true)} disabled={!dueOrders.length}>+ Record payment</Button>}
    >
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card bodyClassName="p-4">
          <div className="text-xs font-semibold uppercase tracking-wider text-emerald-600">Total collected</div>
          <div className="mt-1 text-2xl font-bold text-slate-900">{formatCurrency(stats.collected)}</div>
          <div className="mt-1 text-xs text-slate-400">{payments.length} receipts</div>
        </Card>
        <Card bodyClassName="p-4">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">This month</div>
          <div className="mt-1 text-2xl font-bold text-slate-900">{formatCurrency(stats.thisMonth)}</div>
          <div className="mt-1 text-xs text-slate-400">
            {stats.byMode.map((m) => `${m.label.split(' ')[0]} ${formatCurrency(m.total, { compact: true })}`).join(' · ') || '—'}
          </div>
        </Card>
        <Card bodyClassName="p-4">
          <div className="text-xs font-semibold uppercase tracking-wider text-rose-600">Outstanding balance</div>
          <div className="mt-1 text-2xl font-bold text-slate-900">{formatCurrency(stats.outstanding)}</div>
          <div className="mt-1 text-xs text-slate-400">{dueOrders.length} order{dueOrders.length === 1 ? '' : 's'} with a balance</div>
        </Card>
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <Input name="search" placeholder="Search customer, order or reference..." value={search} onChange={(e) => setSearch(e.target.value)} className="sm:max-w-sm" />
        <Select name="mode" value={mode} onChange={(e) => setMode(e.target.value)} options={[{ value: 'all', label: 'All modes' }, ...PAYMENT_MODES]} className="sm:max-w-[240px]" />
      </div>

      <Table columns={columns} data={filtered} isLoading={loading} emptyMessage="No payments match your filters" />

      <RecordPaymentModal isOpen={open} orders={orders} onClose={() => setOpen(false)} onRecorded={load} />
    </PageShell>
  )
}
