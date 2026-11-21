// Admin dashboard home (/admin): KPI cards, charts and the tables that need attention.
// KPI numbers come from GET /dashboard/admin. The charts are worked out from the orders,
// enquiries and tickets lists, because the backend has no chart endpoints.
import { useEffect, useState } from 'react'
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  Hammer,
  IndianRupee,
  LifeBuoy,
  TrendingUp,
  UserPlus,
  Wallet,
} from 'lucide-react'
import { Button, Card, DataTable, PageHeader, StatCard, StatusBadge, Tabs, useToast } from '@/components/ui'
import FunnelChart from '@/components/dashboard/FunnelChart'
import ProfitChart from '@/components/dashboard/ProfitChart'
import ProfitModal from '@/components/dashboard/ProfitModal'
import RevenueChart from '@/components/dashboard/RevenueChart'
import { getAdminDashboard, getEnquiries, getOrders, getTickets } from '@/api/dashboard'
import { useAuth } from '@/context/AuthContext'
import { downloadCSV } from '@/utils/csv'
import { formatCurrency, formatDate } from '@/utils/format'

const RANGES = [
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'Last 7 days' },
  { value: 'month', label: 'This month' },
]

const DAY = 24 * 60 * 60 * 1000
const UNFINISHED = ['confirmed', 'packed', 'dispatched', 'delivered'] // sold but not installed yet

// How many days ago a date was
const daysOld = (date) => Math.floor((Date.now() - new Date(date)) / DAY)

// Revenue per day for the chart. Quoted orders are not sales yet, so they are skipped (same as the backend).
function revenueByDay(orders, days) {
  const result = []
  for (let i = days - 1; i >= 0; i--) {
    const day = new Date(Date.now() - i * DAY).toDateString()
    const revenue = orders
      .filter((o) => o.status !== 'quoted' && new Date(o.createdAt).toDateString() === day)
      .reduce((sum, o) => sum + o.total, 0)
    result.push({ label: new Date(day).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }), revenue })
  }
  return result
}

export default function Overview() {
  const { user } = useAuth()
  const toast = useToast()
  const [range, setRange] = useState('today')
  const [stats, setStats] = useState(null)
  const [orders, setOrders] = useState([])
  const [enquiries, setEnquiries] = useState([])
  const [tickets, setTickets] = useState([])
  const [selectedOrder, setSelectedOrder] = useState(null) // order shown in the profit pop-up

  // Load everything once, at the same time
  useEffect(() => {
    Promise.all([getAdminDashboard(), getOrders(), getEnquiries(), getTickets()])
      .then(([dashboard, orderList, enquiryList, ticketList]) => {
        setStats(dashboard)
        setOrders(orderList)
        setEnquiries(enquiryList)
        setTickets(ticketList)
      })
      .catch((err) => toast.error(err.message))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const loading = !stats
  const sales = orders.filter((o) => o.status !== 'quoted') // real sales (profit chart, CSV)
  const unfinishedJobs = orders.filter((o) => UNFINISHED.includes(o.status))
  const oldTickets = tickets.filter((t) => ['open', 'assigned'].includes(t.status) && daysOld(t.createdAt) > 3)
  const rangeLabel = RANGES.find((r) => r.value === range).label

  const kpis = [
    { label: `Revenue · ${rangeLabel}`, value: formatCurrency(stats?.revenue[range]), icon: IndianRupee, tone: 'orange', hint: `Total ${formatCurrency(stats?.revenue.total)}` },
    { label: 'Payments pending', value: formatCurrency(stats?.pendingPayments), icon: Wallet, tone: 'amber', hint: `Collected ${formatCurrency(stats?.collected)}` },
    { label: 'Profit', value: formatCurrency(stats?.profit), icon: TrendingUp, tone: 'green', hint: 'Revenue minus cost' },
    { label: 'New enquiries', value: stats?.counts.newEnquiries, icon: UserPlus, tone: 'purple', hint: `${stats?.counts.pendingQuotes ?? 0} quotes waiting` },
    { label: 'Installs completed', value: stats?.counts.installedOrders, icon: CheckCircle2, tone: 'green' },
    { label: 'Unfinished installs', value: stats?.counts.unfinishedInstalls, icon: Hammer, tone: 'blue' },
    { label: 'Open tickets', value: stats?.counts.openTickets, icon: LifeBuoy, tone: 'red' },
    { label: 'Low-stock items', value: stats?.counts.lowStockCount, icon: AlertTriangle, tone: 'amber' },
  ]

  // CSV: KPI numbers first, then the profit of every order
  function exportCSV() {
    const rows = [
      ['SolarConnect summary', formatDate(new Date())],
      [],
      ['KPI', 'Value'],
      ['Revenue today (INR)', stats.revenue.today],
      ['Revenue last 7 days (INR)', stats.revenue.week],
      ['Revenue this month (INR)', stats.revenue.month],
      ['Revenue total (INR)', stats.revenue.total],
      ['Collected (INR)', stats.collected],
      ['Payments pending (INR)', stats.pendingPayments],
      ['Profit (INR)', stats.profit],
      ['New enquiries', stats.counts.newEnquiries],
      ['Installs completed', stats.counts.installedOrders],
      ['Unfinished installs', stats.counts.unfinishedInstalls],
      ['Open tickets', stats.counts.openTickets],
      ['Low-stock items', stats.counts.lowStockCount],
      [],
      ['Order', 'Customer', 'Status', 'Total', 'Cost', 'Profit', 'Paid'],
      ...sales.map((o) => [o.code, o.customer?.name, o.status, o.total, o.totalCost, o.total - o.totalCost, o.amountPaid]),
    ]
    downloadCSV('solarconnect-summary.csv', rows)
  }

  const jobColumns = [
    { key: 'code', header: 'Order', className: 'font-medium text-slate-900' },
    { key: 'customer.name', header: 'Customer' },
    { key: 'status', header: 'Stage', render: (o) => <StatusBadge status={o.status} /> },
    { key: 'pending', header: 'Pending', align: 'right', render: (o) => formatCurrency(o.total - o.amountPaid) },
  ]

  const ticketColumns = [
    { key: 'code', header: 'Ticket', className: 'font-medium text-slate-900' },
    { key: 'customer.name', header: 'Customer' },
    { key: 'issue', header: 'Problem', className: 'max-w-xs truncate' },
    { key: 'status', header: 'Status', render: (t) => <StatusBadge status={t.status} /> },
    {
      key: 'createdAt',
      header: 'Age',
      render: (t) => <span className="font-medium text-danger-700">{daysOld(t.createdAt)} days</span>,
    },
  ]

  return (
    <>
      <PageHeader
        title={`Welcome, ${user?.name?.split(' ')[0] ?? ''}`}
        subtitle="Company performance at a glance"
        actions={
          <Button variant="secondary" icon={Download} onClick={exportCSV} disabled={loading}>
            Export CSV
          </Button>
        }
      />

      {/* Today / Last 7 days / This month (changes the revenue card and chart) */}
      <Tabs tabs={RANGES} value={range} onChange={setRange} className="mb-6" />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((k) => (
          <StatCard key={k.label} {...k} loading={loading} />
        ))}
      </div>

      {/* Revenue line chart + lead funnel */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card title="Revenue by day" subtitle={range === 'month' ? 'Last 30 days' : 'Last 7 days'} className="lg:col-span-2">
          {loading ? <ChartPlaceholder /> : <RevenueChart data={revenueByDay(orders, range === 'month' ? 30 : 7)} />}
        </Card>
        <Card title="Lead funnel" subtitle="Enquiries by status">
          {loading ? <ChartPlaceholder /> : <FunnelChart enquiries={enquiries} />}
        </Card>
      </div>

      {/* Profit per order */}
      <Card title="Profit per job" subtitle="Top 10 orders · click a bar to see the breakdown" className="mt-6">
        {loading ? <ChartPlaceholder /> : <ProfitChart orders={sales} onSelect={setSelectedOrder} />}
      </Card>

      {/* Tables that need attention */}
      <div className="mt-6 grid grid-cols-1 gap-6 2xl:grid-cols-2">
        <div>
          <h3 className="mb-3 text-sm font-semibold text-slate-900">Unfinished jobs</h3>
          <DataTable
            columns={jobColumns}
            data={unfinishedJobs}
            loading={loading}
            pageSize={5}
            onRowClick={setSelectedOrder}
            emptyTitle="All jobs are finished"
          />
        </div>
        <div>
          <h3 className="mb-3 text-sm font-semibold text-slate-900">Open tickets older than 3 days</h3>
          <DataTable
            columns={ticketColumns}
            data={oldTickets}
            loading={loading}
            pageSize={5}
            emptyTitle="No old tickets"
            emptyDescription="Every ticket is being handled on time."
          />
        </div>
      </div>

      <ProfitModal order={selectedOrder} onClose={() => setSelectedOrder(null)} />
    </>
  )
}

// Grey box shown while a chart is loading
function ChartPlaceholder() {
  return <div className="h-[280px] animate-pulse rounded-lg bg-slate-100" />
}
