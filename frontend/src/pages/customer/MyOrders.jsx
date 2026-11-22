// /customer - my enquiry (until it becomes an order) and my orders: progress, payment,
// parts with serial numbers, installation details and the invoice.
import { useEffect, useState } from 'react'
import { FileText } from 'lucide-react'
import { Badge, Card, EmptyState, Loader, PageHeader, useToast } from '@/components/ui'
import { getPortalSummary } from '@/api/portal'
import { ORDER_STATUSES, statusLabel } from '@/constants/status'
import { formatCurrency, formatDate } from '@/utils/format'

// { capacityKw: 3, systemType: 'off_grid' } -> "3 kW Off-Grid"
const systemText = (x) =>
  x.systemType ? `${x.capacityKw ?? '?'} kW ${x.systemType === 'off_grid' ? 'Off-Grid' : 'On-Grid'}` : ''

export default function MyOrders() {
  const toast = useToast()
  const [data, setData] = useState(null)

  useEffect(() => {
    getPortalSummary()
      .then(setData)
      .catch((err) => toast.error(err.message))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!data) return <Loader label="Loading your account..." />

  // enquiries that have not turned into an order yet
  const openEnquiries = data.enquiries.filter((e) => e.status !== 'converted')

  return (
    <>
      <PageHeader title="My orders" subtitle="Your solar system from quote to installation" />

      {openEnquiries.map((e) => (
        <Card key={e._id} title={`Enquiry ${e.code}`} subtitle={`Sent on ${formatDate(e.createdAt)}`} className="mb-4">
          <p className="text-sm text-slate-700">
            You asked for <strong>{systemText(e) || 'a solar system'}</strong>.
          </p>
          <p className="mt-2 text-sm text-slate-600">
            {e.status === 'lost'
              ? 'This enquiry was closed. Please contact us if you are still interested.'
              : e.surveyTechnician
                ? `Site survey: ${statusLabel(e.surveyStatus)}. ${e.surveyTechnician.name} will visit on ${formatDate(e.surveyDate)}.`
                : 'Our team will call you to book a free site survey.'}
          </p>
        </Card>
      ))}

      {data.orders.length === 0 ? (
        openEnquiries.length === 0 && <EmptyState title="No orders yet" description="Your orders will show up here." />
      ) : (
        <div className="space-y-6">
          {data.orders.map((order) => (
            <OrderCard key={order._id} order={order} />
          ))}
        </div>
      )}
    </>
  )
}

function OrderCard({ order }) {
  const step = ORDER_STATUSES.indexOf(order.status)
  const balance = order.total - order.amountPaid

  return (
    <Card
      title={`Order ${order.code}`}
      subtitle={`${systemText(order)} · ${formatDate(order.createdAt)}`}
      actions={
        <a
          href={`/invoice/order/${order._id}`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex h-8 items-center gap-1.5 rounded-control px-3 text-xs font-medium text-slate-700 ring-1 ring-slate-300 ring-inset hover:bg-slate-50"
        >
          <FileText className="h-4 w-4" /> Invoice
        </a>
      }
    >
      {/* Progress */}
      <div className="flex flex-wrap items-center gap-2">
        {ORDER_STATUSES.map((s, i) => (
          <span
            key={s}
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              i === step ? 'bg-primary-600 text-white' : i < step ? 'bg-success-50 text-success-700' : 'bg-slate-100 text-slate-400'
            }`}
          >
            {statusLabel(s)}
          </span>
        ))}
      </div>

      {order.scheduledDate && order.status !== 'installed' && (
        <p className="mt-3 text-sm text-slate-600">
          Installation booked for {formatDate(order.scheduledDate)}
          {order.assignedTechnician && ` with ${order.assignedTechnician.name}`}.
        </p>
      )}
      {order.installedAt && <p className="mt-3 text-sm text-slate-600">Installed on {formatDate(order.installedAt)}.</p>}

      {/* Payment */}
      <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
        <div className="rounded-lg bg-slate-50 p-3">
          <p className="text-xs text-slate-500">Total</p>
          <p className="font-semibold text-slate-900">{formatCurrency(order.total)}</p>
        </div>
        <div className="rounded-lg bg-success-50 p-3">
          <p className="text-xs text-success-700">Paid</p>
          <p className="font-semibold text-success-700">{formatCurrency(order.amountPaid)}</p>
        </div>
        <div className="rounded-lg bg-slate-50 p-3">
          <p className="text-xs text-slate-500">Balance</p>
          <p className="font-semibold text-slate-900">{formatCurrency(balance)}</p>
        </div>
      </div>

      {/* Parts */}
      <p className="mt-5 text-xs font-semibold tracking-wide text-slate-500 uppercase">What you get</p>
      <ul className="mt-2 space-y-1 text-sm text-slate-700">
        {order.items.map((item) => (
          <li key={item._id} className="flex justify-between">
            <span>{item.product?.name ?? 'Product'}</span>
            <span className="text-slate-500">× {item.qty}</span>
          </li>
        ))}
      </ul>

      {/* Serial numbers noted by the warehouse at dispatch */}
      <p className="mt-5 text-xs font-semibold tracking-wide text-slate-500 uppercase">Serial numbers</p>
      {order.serials?.length ? (
        <div className="mt-2 flex flex-wrap gap-2">
          {order.serials.map((s) => (
            <code key={s} className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-700">
              {s}
            </code>
          ))}
        </div>
      ) : (
        <p className="mt-1 text-sm text-slate-500">Added when your order is dispatched.</p>
      )}

      <div className="mt-4">
        <Badge status={order.status} />
      </div>
    </Card>
  )
}
