// Lead funnel: how many enquiries are at each status, as a share of all enquiries.
import { statusLabel } from '@/constants/status'

const STAGES = ['new', 'follow_up', 'converted', 'lost']

export default function FunnelChart({ enquiries }) {
  const total = enquiries.length || 1 // avoid dividing by 0
  const countOf = (status) => enquiries.filter((e) => e.status === status).length

  return (
    <div className="space-y-3">
      {STAGES.map((status) => {
        const count = countOf(status)
        const percent = Math.round((count / total) * 100)
        const color = status === 'converted' ? 'bg-success-500' : status === 'lost' ? 'bg-danger-500' : 'bg-primary-500'
        return (
          <div key={status}>
            <div className="mb-1 flex justify-between text-sm">
              <span className="font-medium text-slate-700">{statusLabel(status)}</span>
              <span className="text-slate-500">
                {count} <span className="text-xs">({percent}%)</span>
              </span>
            </div>
            <div className="h-3 rounded-full bg-slate-100">
              <div className={`h-3 rounded-full ${color}`} style={{ width: `${percent}%` }} />
            </div>
          </div>
        )
      })}
      <p className="pt-2 text-xs text-slate-500">
        {enquiries.length} enquiries in total ·{' '}
        <b className="text-slate-700">{Math.round((countOf('converted') / total) * 100)}%</b> converted to customers.
      </p>
    </div>
  )
}
