// /admin/invoices - one place for all money coming in: orders and repair bills.
import { useEffect, useState } from 'react'
import { FileText, IndianRupee, Wallet, AlertCircle } from 'lucide-react'
import { Badge, Button, DataTable, Input, PageHeader, Select, StatCard, StatusBadge, Tabs, useToast } from '@/components/ui'
import { getOrders, getRepairBills } from '@/api/invoices'
import { formatCurrency, formatDate } from '@/utils/format'

const TYPE_TABS = [
  { value: 'all', label: 'All' },
  { value: 'order', label: 'Orders' },
  { value: 'repair', label: 'Repair bills' },
]

const PAYMENT_OPTIONS = [
  { value: 'unpaid', label: 'Unpaid' },
  { value: 'partly_paid', label: 'Partly paid' },
  { value: 'paid', label: 'Paid' },
]

// Payment status from the numbers
function paymentStatus(total, paid) {
  if (paid >= total) return 'paid'
  if (paid > 0) return 'partly_paid'
  return 'unpaid'
}
const PAYMENT_BADGE = {
  paid: <Badge tone="green">Paid</Badge>,
  partly_paid: <Badge tone="amber">Partly paid</Badge>,
  unpaid: <Badge tone="red">Unpaid</Badge>,
}

// Turn an order and a repair ticket into the same row shape, so one table can show both
const orderToRow = (o) => ({
  key: `order-${o._id}`,
  type: 'order',
  id: o._id,
  number: o.code,
  customer: o.customer?.name,
  date: o.createdAt,
  total: o.total,
  paid: o.amountPaid,
  balance: o.total - o.amountPaid,
  workStatus: o.status,
  payment: paymentStatus(o.total, o.amountPaid),
})
// The backend does not record repair payments yet, so a repair bill counts as unpaid
const repairToRow = (t) => ({
  key: `repair-${t._id}`,
  type: 'repair',
  id: t._id,
  number: t.code,
  customer: t.customer?.name,
  date: t.createdAt,
  total: t.billAmount,
  paid: 0,
  balance: t.billAmount,
  workStatus: t.status,
  payment: 'unpaid',
})

export default function Invoices() {
  const toast = useToast()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [type, setType] = useState('all')
  const [payment, setPayment] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')

  // Load orders and repair bills together, newest first
  useEffect(() => {
    Promise.all([getOrders(), getRepairBills()])
      .then(([orders, bills]) => {
        // a quote is not a sale yet, so quoted orders are left out (same as the dashboard revenue)
        const sales = orders.filter((o) => o.status !== 'quoted')
        const all = [...sales.map(orderToRow), ...bills.map(repairToRow)]
        setRows(all.sort((a, b) => new Date(b.date) - new Date(a.date)))
      })
      .catch((err) => toast.error(err.message))
      .finally(() => setLoading(false))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Apply the filters (type tab, payment status, date range)
  const shown = rows.filter((r) => {
    const day = r.date.slice(0, 10) // "2026-11-21"
    if (type !== 'all' && r.type !== type) return false
    if (payment && r.payment !== payment) return false
    if (fromDate && day < fromDate) return false
    if (toDate && day > toDate) return false
    return true
  })

  // Totals for the cards, based on what is shown
  const billed = shown.reduce((sum, r) => sum + r.total, 0)
  const collected = shown.reduce((sum, r) => sum + r.paid, 0)

  const clearFilters = () => {
    setPayment('')
    setFromDate('')
    setToDate('')
  }

  const columns = [
    { key: 'number', header: 'Invoice', sortable: true, className: 'font-medium text-slate-900' },
    {
      key: 'type',
      header: 'Type',
      render: (r) => (r.type === 'order' ? <Badge tone="blue" dot={false}>Order</Badge> : <Badge tone="purple" dot={false}>Repair</Badge>),
    },
    { key: 'customer', header: 'Customer', sortable: true },
    { key: 'date', header: 'Date', sortable: true, render: (r) => formatDate(r.date) },
    { key: 'total', header: 'Total', align: 'right', sortable: true, render: (r) => formatCurrency(r.total) },
    { key: 'paid', header: 'Paid', align: 'right', render: (r) => formatCurrency(r.paid) },
    {
      key: 'balance',
      header: 'Balance',
      align: 'right',
      sortable: true,
      render: (r) => <span className={r.balance > 0 ? 'font-medium text-danger-700' : 'text-slate-500'}>{formatCurrency(r.balance)}</span>,
    },
    { key: 'payment', header: 'Payment', render: (r) => PAYMENT_BADGE[r.payment] },
    { key: 'workStatus', header: 'Status', render: (r) => <StatusBadge status={r.workStatus} /> },
    {
      key: 'actions',
      header: '',
      align: 'right',
      // Opens the printable invoice in a new tab (Print -> Save as PDF)
      render: (r) => (
        <a
          href={`/invoice/${r.type}/${r.id}`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-700"
        >
          <FileText className="h-4 w-4" /> Invoice
        </a>
      ),
    },
  ]

  return (
    <>
      <PageHeader title="Invoices" subtitle="All money coming in: product orders and repair bills" />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Total billed" value={formatCurrency(billed)} icon={IndianRupee} tone="orange" loading={loading} />
        <StatCard label="Collected" value={formatCurrency(collected)} icon={Wallet} tone="green" loading={loading} />
        <StatCard label="Balance due" value={formatCurrency(billed - collected)} icon={AlertCircle} tone="red" loading={loading} />
      </div>

      <Tabs
        tabs={TYPE_TABS.map((t) => ({ ...t, count: t.value === 'all' ? rows.length : rows.filter((r) => r.type === t.value).length }))}
        value={type}
        onChange={setType}
        className="my-6"
      />

      <DataTable
        columns={columns}
        data={shown}
        loading={loading}
        rowKey="key"
        searchable
        searchKeys={['number', 'customer']}
        searchPlaceholder="Search invoice or customer..."
        toolbar={
          <>
            <Select value={payment} onChange={(e) => setPayment(e.target.value)} options={PAYMENT_OPTIONS} placeholder="Any payment" aria-label="Payment status" />
            <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} aria-label="From date" />
            <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} aria-label="To date" />
            {(payment || fromDate || toDate) && (
              <Button variant="ghost" onClick={clearFilters}>
                Clear
              </Button>
            )}
          </>
        }
        emptyTitle="No invoices match"
        emptyDescription="Try another status or date range."
      />
    </>
  )
}
