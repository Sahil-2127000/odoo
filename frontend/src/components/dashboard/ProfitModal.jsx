// Pop-up that shows how the profit of one job is worked out.
import { Modal } from '@/components/ui'
import { formatCurrency, formatKw, formatPercent } from '@/utils/format'

export default function ProfitModal({ job, onClose }) {
  if (!job) return null

  const rows = [
    { label: 'Sale price', value: job.sale },
    { label: 'Parts cost', value: -job.partsCost },
    { label: 'Labour', value: -job.labour },
    { label: 'Repair cost', value: -job.repairCost },
  ]

  return (
    <Modal
      open
      onClose={onClose}
      title={`Profit breakdown · ${job.orderNumber}`}
      description={`${job.customerName} · ${formatKw(job.capacityKw)} system`}
      size="sm"
    >
      <dl className="divide-y divide-slate-100 text-sm">
        {rows.map((row) => (
          <div key={row.label} className="flex justify-between py-2.5">
            <dt className="text-slate-600">{row.label}</dt>
            <dd className={row.value < 0 ? 'text-danger-700' : 'text-slate-900'}>
              {row.value < 0 ? '− ' : ''}
              {formatCurrency(Math.abs(row.value))}
            </dd>
          </div>
        ))}
        <div className="flex justify-between py-3 text-base font-semibold">
          <dt className="text-slate-900">Profit</dt>
          <dd className={job.profit >= 0 ? 'text-success-700' : 'text-danger-700'}>{formatCurrency(job.profit)}</dd>
        </div>
      </dl>
      <p className="text-xs text-slate-500">Margin: {formatPercent(job.profit / job.sale)} of the sale price.</p>
    </Modal>
  )
}
