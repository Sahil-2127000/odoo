// /admin/orders - every order with its status, money and profit. Click a row to open the details.
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { DataTable, PageHeader, StatusBadge, Tabs, useToast } from '@/components/ui'
import { getOrders } from '@/api/orders'
import { ORDER_STATUSES, statusLabel } from '@/constants/status'
import { formatCurrency, formatDate } from '@/utils/format'

export default function Orders() {
  const toast = useToast()
  const navigate = useNavigate()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('') // '' = all

  // Load all orders once; the status tabs filter them in the browser so the counts stay correct
  useEffect(() => {
    getOrders()
      .then(setOrders)
      .catch((err) => toast.error(err.message))
      .finally(() => setLoading(false))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const shown = status ? orders.filter((o) => o.status === status) : orders

  const tabs = [
    { value: '', label: 'All', count: orders.length },
    ...ORDER_STATUSES.map((s) => ({ value: s, label: statusLabel(s), count: orders.filter((o) => o.status === s).length })),
  ]

  const columns = [
    { key: 'code', header: 'Order', sortable: true, className: 'font-medium text-slate-900' },
    { key: 'customer.name', header: 'Customer', sortable: true },
    { key: 'customer.phone', header: 'Phone' },
    { key: 'createdAt', header: 'Date', sortable: true, render: (o) => formatDate(o.createdAt) },
    { key: 'total', header: 'Total', align: 'right', sortable: true, render: (o) => formatCurrency(o.total) },
    {
      key: 'pending',
      header: 'Pending',
      align: 'right',
      sortValue: (o) => o.total - o.amountPaid,
      sortable: true,
      render: (o) => {
        const pending = o.total - o.amountPaid
        return <span className={pending > 0 ? 'font-medium text-danger-700' : 'text-slate-500'}>{formatCurrency(pending)}</span>
      },
    },
    {
      key: 'profit',
      header: 'Profit',
      align: 'right',
      render: (o) => <span className="text-success-700">{formatCurrency(o.total - o.totalCost)}</span>,
    },
    { key: 'status', header: 'Status', render: (o) => <StatusBadge status={o.status} /> },
  ]

  return (
    <>
      <PageHeader title="Orders" subtitle="From quote to installation. Click an order to see the details." />

      <Tabs tabs={tabs} value={status} onChange={setStatus} className="mb-6" />

      <DataTable
        columns={columns}
        data={shown}
        loading={loading}
        searchable
        searchKeys={['code', 'customer.name', 'customer.phone']}
        searchPlaceholder="Search order, customer or phone..."
        onRowClick={(o) => navigate(`/admin/orders/${o._id}`)}
        emptyTitle="No orders here"
        emptyDescription="Orders are created by Sales from a converted enquiry."
      />
    </>
  )
}
