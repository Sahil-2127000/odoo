// Admin dashboard home (/admin): KPI cards, charts and the tables that need attention.
import { useEffect, useState } from 'react'
import { AlertTriangle, CheckCircle2, Download, Hammer, IndianRupee, LifeBuoy, Wallet } from 'lucide-react'
import { Button, Card, DataTable, PageHeader, StatCard, StatusBadge, Tabs } from '@/components/ui'
import FunnelChart from '@/components/dashboard/FunnelChart'
import ProfitChart from '@/components/dashboard/ProfitChart'
import ProfitModal from '@/components/dashboard/ProfitModal'
import RevenueChart from '@/components/dashboard/RevenueChart'
import { getDashboardSummary, getFunnel, getProfitPerJob } from '@/api/dashboard'
import { useAuth } from '@/context/AuthContext'
import { downloadCSV } from '@/utils/csv'
import { formatCurrency, formatDate, formatKw } from '@/utils/format'

const RANGES = [
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'This week' },
  { value: 'month', label: 'This month' },
]

// How many days ago a date was
const daysOld = (date) => Math.floor((Date.now() - new Date(date)) / (24 * 60 * 60 * 1000))

export default function Overview() {
  const { user } = useAuth()
  const [range, setRange] = useState('today')
  const [summaries, setSummaries] = useState({}) // one summary saved per range: { today: {...}, week: {...} }
  const [profitJobs, setProfitJobs] = useState([])
  const [funnel, setFunnel] = useState([])
  const [selectedJob, setSelectedJob] = useState(null) // job shown in the profit pop-up
  const [error, setError] = useState('')

  const summary = summaries[range]
  const loading = !summary

  // Load the summary whenever the range changes (skip if we already have it)
  useEffect(() => {
    if (summaries[range]) return
    getDashboardSummary(range)
      .then((data) => setSummaries((prev) => ({ ...prev, [range]: data })))
      .catch((err) => setError(err.message))
  }, [range, summaries])

  // Profit per job and the lead funnel do not depend on the range, so load them once
  useEffect(() => {
    Promise.all([getProfitPerJob(), getFunnel()])
      .then(([jobs, stages]) => {
        setProfitJobs(jobs)
        setFunnel(stages)
      })
      .catch((err) => setError(err.message))
  }, [])

  const kpis = [
    { label: 'Revenue', value: formatCurrency(summary?.revenue), icon: IndianRupee, tone: 'orange' },
    { label: 'Payments pending', value: formatCurrency(summary?.paymentsPending), icon: Wallet, tone: 'amber' },
    { label: 'Installs completed', value: summary?.installsCompleted, icon: CheckCircle2, tone: 'green' },
    { label: 'Unfinished installs', value: summary?.unfinishedInstalls, icon: Hammer, tone: 'blue' },
    { label: 'Open tickets', value: summary?.openTickets, icon: LifeBuoy, tone: 'red' },
    { label: 'Low-stock items', value: summary?.lowStockItems, icon: AlertTriangle, tone: 'purple' },
  ]

  // Build the CSV: KPI numbers first, then the profit of every job
  function exportCSV() {
    const rangeLabel = RANGES.find((r) => r.value === range).label
    const rows = [
      ['SolarConnect summary', rangeLabel],
      [],
      ['KPI', 'Value'],
      ['Revenue (INR)', summary.revenue],
      ['Payments pending (INR)', summary.paymentsPending],
      ['Installs completed', summary.installsCompleted],
      ['Unfinished installs', summary.unfinishedInstalls],
      ['Open tickets', summary.openTickets],
      ['Low-stock items', summary.lowStockItems],
      [],
      ['Order', 'Customer', 'Sale', 'Parts cost', 'Labour', 'Repair cost', 'Profit'],
      ...profitJobs.map((j) => [j.orderNumber, j.customerName, j.sale, j.partsCost, j.labour, j.repairCost, j.profit]),
    ]
    downloadCSV(`solarconnect-summary-${range}.csv`, rows)
  }

  const jobColumns = [
    { key: 'orderNumber', header: 'Order', className: 'font-medium text-slate-900' },
    { key: 'customerName', header: 'Customer' },
    { key: 'capacityKw', header: 'Size', render: (j) => formatKw(j.capacityKw) },
    { key: 'stage', header: 'Stage', render: (j) => <StatusBadge status={j.stage} /> },
    { key: 'technician', header: 'Technician' },
  ]

  const ticketColumns = [
    { key: 'ticketNumber', header: 'Ticket', className: 'font-medium text-slate-900' },
    { key: 'customerName', header: 'Customer' },
    { key: 'issue', header: 'Problem' },
    { key: 'status', header: 'Status', render: (t) => <StatusBadge status={t.status} /> },
    {
      key: 'createdAt',
      header: 'Age',
      render: (t) => (
        <span title={formatDate(t.createdAt)} className="font-medium text-danger-700">
          {daysOld(t.createdAt)} days
        </span>
      ),
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

      {error && (
        <div className="mb-4 rounded-lg border border-danger-500/30 bg-danger-50 px-4 py-3 text-sm text-danger-700">
          {error}
        </div>
      )}

      {/* Today / This week / This month */}
      <Tabs tabs={RANGES} value={range} onChange={setRange} className="mb-6" />

      {/* 6 KPI cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {kpis.map((k) => (
          <StatCard key={k.label} {...k} loading={loading} />
        ))}
      </div>

      {/* Revenue line chart + lead funnel */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card title="Revenue by day" subtitle={RANGES.find((r) => r.value === range).label} className="lg:col-span-2">
          {loading ? <ChartPlaceholder /> : <RevenueChart data={summary.revenueByDay} />}
        </Card>
        <Card title="Lead funnel" subtitle="From new enquiry to won">
          {funnel.length ? <FunnelChart stages={funnel} /> : <ChartPlaceholder />}
        </Card>
      </div>

      {/* Profit per job bar chart */}
      <Card title="Profit per job" subtitle="Top 10 jobs · click a bar to see the breakdown" className="mt-6">
        {profitJobs.length ? <ProfitChart jobs={profitJobs} onSelect={setSelectedJob} /> : <ChartPlaceholder />}
      </Card>

      {/* Tables that need attention */}
      <div className="mt-6 grid grid-cols-1 gap-6 2xl:grid-cols-2">
        <div>
          <h3 className="mb-3 text-sm font-semibold text-slate-900">Unfinished jobs</h3>
          <DataTable
            columns={jobColumns}
            data={summary?.unfinishedJobs}
            loading={loading}
            rowKey="orderNumber"
            pageSize={5}
            emptyTitle="All jobs are finished"
          />
        </div>
        <div>
          <h3 className="mb-3 text-sm font-semibold text-slate-900">Open tickets older than 3 days</h3>
          <DataTable
            columns={ticketColumns}
            data={summary?.oldTickets}
            loading={loading}
            rowKey="ticketNumber"
            pageSize={5}
            emptyTitle="No old tickets"
            emptyDescription="Every ticket is being handled on time."
          />
        </div>
      </div>

      {/* Profit pop-up, opened by clicking a bar */}
      <ProfitModal job={selectedJob} onClose={() => setSelectedJob(null)} />
    </>
  )
}

// Grey box shown while a chart is loading
function ChartPlaceholder() {
  return <div className="h-[280px] animate-pulse rounded-lg bg-slate-100" />
}
