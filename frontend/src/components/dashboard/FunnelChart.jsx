// Lead funnel: how many leads reached each stage, from "new" down to "won".
// Drawn as simple bars whose width is the share of all new leads.
import { statusLabel } from '@/constants/status'

export default function FunnelChart({ stages }) {
  const total = stages[0]?.count || 1 // everyone starts as a "new" lead

  return (
    <div className="space-y-3">
      {stages.map((stage) => {
        const percent = Math.round((stage.count / total) * 100)
        return (
          <div key={stage.status}>
            <div className="mb-1 flex justify-between text-sm">
              <span className="font-medium text-slate-700">{statusLabel(stage.status)}</span>
              <span className="text-slate-500">
                {stage.count} <span className="text-xs">({percent}%)</span>
              </span>
            </div>
            <div className="h-3 rounded-full bg-slate-100">
              <div
                className={stage.status === 'won' ? 'h-3 rounded-full bg-success-500' : 'h-3 rounded-full bg-primary-500'}
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>
        )
      })}
      <p className="pt-2 text-xs text-slate-500">
        Conversion: <b className="text-slate-700">{Math.round(((stages.at(-1)?.count || 0) / total) * 100)}%</b> of new
        leads were won.
      </p>
    </div>
  )
}
