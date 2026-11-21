// Sales landing dashboard: pipeline KPIs, revenue, and recent activity.
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import PageShell from './PageShell'
import { Card, Badge, Table } from './ui'
import { overviewApi, ordersApi, quotationsApi } from '@/api/sales'
import { formatCurrency, formatDate, listFrom } from './salesHelpers'

function Kpi({ label, value, hint, tone = 'text-slate-900', to }) {
  const body = (
    <div className="h-full rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs transition-colors hover:border-amber-200">
      <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</div>
      <div className={`mt-1.5 text-2xl font-bold ${tone}`}>{value}</div>
      {hint && <div className="mt-1 text-xs text-slate-400">{hint}</div>}
    </div>
  )
  return to ? <Link to={to}>{body}</Link> : body
}

export default function SalesDashboard() {
  const [overview, setOverview] = useState(null)
  const [orders, setOrders] = useState([])
  const [quotes, setQuotes] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([overviewApi.getSalesOverview(), ordersApi.getOrders(), quotationsApi.getQuotations()])
      .then(([ov, ord, qt]) => {
        setOverview(ov?.data || null)
        setOrders(listFrom(ord))
        setQuotes(listFrom(qt))
      })
      .finally(() => setLoading(false))
  }, [])

  const o = overview || {}
  const outstanding = orders.reduce((sum, ord) => sum + (ord.balanceAmount || 0), 0)
  const openQuotes = quotes.filter((q) => q.status === 'draft' || q.status === 'sent')
  const openQuoteValue = openQuotes.reduce((sum, q) => sum + (q.grandTotal || 0), 0)
  const collectedPct = o.revenueBooked ? Math.round((o.revenueCollected / o.revenueBooked) * 100) : 0

  const leadColumns = [
    {
      key: 'name',
      title: 'Lead',
      render: (v, row) => (
        <div>
          <div className="font-semibold text-slate-900">{v}</div>
          <div className="text-xs text-slate-400">{row.city}</div>
        </div>
      ),
    },
    { key: 'monthlyBill', title: 'Monthly bill', align: 'right', render: (v) => formatCurrency(v) },
    { key: 'status', title: 'Status', render: (v) => <Badge statusKey={v} size="sm">{v}</Badge> },
    { key: 'createdAt', title: 'Received', render: (v) => formatDate(v) },
  ]

  const orderColumns = [
    {
      key: 'orderNumber',
      title: 'Order',
      render: (v, row) => (
        <Link to={`/sales/orders/${row.id}`} className="font-semibold text-amber-700 hover:underline">
          {v}
        </Link>
      ),
    },
    { key: 'customerName', title: 'Customer' },
    { key: 'balanceAmount', title: 'Balance due', align: 'right', render: (v) => formatCurrency(v) },
    { key: 'paymentStatus', title: 'Payment', render: (v) => <Badge statusKey={v} size="sm">{v}</Badge> },
  ]

  return (
    <PageShell title="Sales dashboard" subtitle="Pipeline from enquiry to payment at a glance.">
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi label="Total leads" value={loading ? '…' : o.totalLeads ?? 0} hint={`${o.convertedLeads ?? 0} converted`} to="/sales/leads" />
        <Kpi label="Conversion rate" value={loading ? '…' : `${o.conversionRate ?? 0}%`} hint="Leads → customers" tone="text-emerald-700" />
        <Kpi label="Surveys pending" value={loading ? '…' : o.pendingSurveys ?? 0} hint="Scheduled site visits" tone="text-amber-700" to="/sales/surveys" />
        <Kpi label="Quotes accepted" value={loading ? '…' : `${o.acceptedQuotes ?? 0} / ${o.totalQuotes ?? 0}`} hint={`${openQuotes.length} open · ${formatCurrency(openQuoteValue, { compact: true })}`} to="/sales/quotations" />
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Kpi label="Revenue booked" value={loading ? '…' : formatCurrency(o.revenueBooked)} hint="Total of all confirmed orders" to="/sales/orders" />
        <Kpi label="Collected" value={loading ? '…' : formatCurrency(o.revenueCollected)} hint={`${collectedPct}% of booked revenue`} tone="text-emerald-700" to="/sales/payments" />
        <Kpi label="Outstanding" value={loading ? '…' : formatCurrency(outstanding)} hint="Balance still to collect" tone="text-rose-700" to="/sales/orders" />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card title="Recent enquiries" actions={<Link to="/sales/leads" className="text-xs font-semibold text-amber-700 hover:underline">All leads</Link>} bodyClassName="p-0">
          <Table columns={leadColumns} data={o.recentLeads || []} isLoading={loading} className="rounded-none border-0" emptyMessage="No leads yet" />
        </Card>
        <Card title="Orders awaiting payment" actions={<Link to="/sales/orders" className="text-xs font-semibold text-amber-700 hover:underline">All orders</Link>} bodyClassName="p-0">
          <Table
            columns={orderColumns}
            data={orders.filter((ord) => ord.paymentStatus !== 'paid')}
            isLoading={loading}
            className="rounded-none border-0"
            emptyMessage="Every order is fully paid"
          />
        </Card>
      </div>
    </PageShell>
  )
}
