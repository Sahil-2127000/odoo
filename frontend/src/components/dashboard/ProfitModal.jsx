// Pop-up that shows how the profit of one order is worked out.
import { Modal, StatusBadge } from '@/components/ui'
import { formatCurrency, formatPercent } from '@/utils/format'

export default function ProfitModal({ order, onClose }) {
  if (!order) return null

  const profit = order.total - order.totalCost

  return (
    <Modal open onClose={onClose} title={`Profit breakdown · ${order.code}`} description={order.customer?.name} size="sm">
      <dl className="divide-y divide-slate-100 text-sm">
        <div className="flex justify-between py-2.5">
          <dt className="text-slate-600">Sale price (incl. 18% GST)</dt>
          <dd className="text-slate-900">{formatCurrency(order.total)}</dd>
        </div>
        <div className="flex justify-between py-2.5">
          <dt className="text-slate-600">Cost of parts and labour</dt>
          <dd className="text-danger-700">− {formatCurrency(order.totalCost)}</dd>
        </div>
        <div className="flex justify-between py-3 text-base font-semibold">
          <dt className="text-slate-900">Profit</dt>
          <dd className={profit >= 0 ? 'text-success-700' : 'text-danger-700'}>{formatCurrency(profit)}</dd>
        </div>
        <div className="flex justify-between py-2.5">
          <dt className="text-slate-600">Paid so far</dt>
          <dd>{formatCurrency(order.amountPaid)}</dd>
        </div>
        <div className="flex justify-between py-2.5">
          <dt className="text-slate-600">Status</dt>
          <dd>
            <StatusBadge status={order.status} />
          </dd>
        </div>
      </dl>
      <p className="mt-2 text-xs text-slate-500">Margin: {formatPercent(profit / order.total)} of the sale price.</p>
    </Modal>
  )
}
