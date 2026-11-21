// /admin/orders/:id - one order: customer, items, money, progress and serial numbers.
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { FileText } from 'lucide-react'
import { Card, EmptyState, Loader, PageHeader, StatusBadge } from '@/components/ui'
import { getOrderById } from '@/api/orders'
import { ORDER_STATUSES, statusLabel } from '@/constants/status'
import { formatCurrency, formatDate } from '@/utils/format'

export default function OrderDetail() {
  const { id } = useParams()
  const [order, setOrder] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    getOrderById(id)
      .then(setOrder)
      .catch((err) => setError(err.message))
  }, [id])

  if (error) return <EmptyState title="Could not load this order" description={error} />
  if (!order) return <Loader label="Loading order..." />

  const pending = order.total - order.amountPaid
  const profit = order.total - order.totalCost
  const currentStep = ORDER_STATUSES.indexOf(order.status)

  return (
    <>
      <PageHeader
        backTo="/admin/orders"
        title={`Order ${order.code}`}
        subtitle={`Created on ${formatDate(order.createdAt)}`}
        actions={
          <a
            href={`/invoice/order/${order._id}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-10 items-center gap-2 rounded-control px-4 text-sm font-medium text-slate-700 ring-1 ring-slate-300 ring-inset hover:bg-slate-50"
          >
            <FileText className="h-4 w-4" /> Invoice
          </a>
        }
      />

      {/* Progress: quoted -> ... -> installed */}
      <Card className="mb-6">
        <div className="flex flex-wrap items-center gap-2">
          {ORDER_STATUSES.map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <span
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  i === currentStep
                    ? 'bg-primary-600 text-white'
                    : i < currentStep
                      ? 'bg-success-50 text-success-700'
                      : 'bg-slate-100 text-slate-400'
                }`}
              >
                {statusLabel(s)}
              </span>
              {i < ORDER_STATUSES.length - 1 && <span className="text-slate-300">→</span>}
            </div>
          ))}
        </div>
        {order.installedAt && (
          <p className="mt-3 text-sm text-slate-600">Installed on {formatDate(order.installedAt)} (warranty starts from this date).</p>
        )}
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Items */}
        <Card title="Items" className="lg:col-span-2" padding={false}>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-xs text-slate-500 uppercase">
                <tr>
                  <th className="px-5 py-3 text-left">Product</th>
                  <th className="px-5 py-3 text-left">Warranty</th>
                  <th className="px-5 py-3 text-right">Qty</th>
                  <th className="px-5 py-3 text-right">Price</th>
                  <th className="px-5 py-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {order.items.map((item, i) => (
                  <tr key={i}>
                    <td className="px-5 py-3 font-medium text-slate-900">{item.product?.name ?? 'Deleted product'}</td>
                    <td className="px-5 py-3 text-slate-600">{item.product?.warrantyYears ?? '—'} yr</td>
                    <td className="px-5 py-3 text-right">{item.qty}</td>
                    <td className="px-5 py-3 text-right">{formatCurrency(item.price)}</td>
                    <td className="px-5 py-3 text-right">{formatCurrency(item.price * item.qty)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Serial numbers are saved by the warehouse when the order is dispatched */}
          <div className="border-t border-slate-100 px-5 py-4 text-sm">
            <p className="font-medium text-slate-700">Serial numbers</p>
            {order.serials?.length ? (
              <div className="mt-2 flex flex-wrap gap-2">
                {order.serials.map((s) => (
                  <code key={s} className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-700">
                    {s}
                  </code>
                ))}
              </div>
            ) : (
              <p className="mt-1 text-slate-500">Added by the warehouse when the order is dispatched.</p>
            )}
          </div>
        </Card>

        <div className="space-y-6">
          {/* Customer */}
          <Card title="Customer">
            <p className="font-medium text-slate-900">{order.customer?.name}</p>
            <p className="text-sm text-slate-600">{order.customer?.code}</p>
            <p className="mt-2 text-sm text-slate-600">{order.customer?.phone}</p>
            {order.customer?.email && <p className="text-sm text-slate-600">{order.customer.email}</p>}
            <p className="text-sm text-slate-600">{order.customer?.address}</p>
          </Card>

          {/* Money */}
          <Card title="Money">
            <dl className="space-y-2 text-sm">
              <Row label="Total (incl. 18% GST)" value={formatCurrency(order.total)} />
              <Row label="Paid" value={formatCurrency(order.amountPaid)} />
              <Row
                label="Pending"
                value={<span className={pending > 0 ? 'text-danger-700' : 'text-success-700'}>{formatCurrency(pending)}</span>}
              />
              <div className="border-t border-slate-100 pt-2">
                <Row label="Cost" value={formatCurrency(order.totalCost)} />
                <Row label="Profit" value={<span className="font-semibold text-success-700">{formatCurrency(profit)}</span>} />
              </div>
            </dl>
            <div className="mt-3">
              <StatusBadge status={order.status} />
            </div>
          </Card>
        </div>
      </div>
    </>
  )
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between">
      <dt className="text-slate-600">{label}</dt>
      <dd className="text-slate-900">{value}</dd>
    </div>
  )
}
