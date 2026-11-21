import { TrendingDown, TrendingUp } from 'lucide-react'
import { cn } from '@/utils/cn'

const ICON_TONES = {
  orange: 'bg-primary-50 text-primary-600',
  green: 'bg-success-50 text-success-700',
  blue: 'bg-info-50 text-info-700',
  amber: 'bg-warning-50 text-warning-700',
  red: 'bg-danger-50 text-danger-700',
  purple: 'bg-violet-50 text-violet-700',
  gray: 'bg-slate-100 text-slate-600',
}

/**
 * <StatCard label="Total revenue" value={formatCurrency(x)} icon={IndianRupee}
 *           tone="orange" trend={12.5} hint="vs last month" />
 */
export default function StatCard({ label, value, icon: Icon, tone = 'orange', trend, hint, loading, className }) {
  const up = trend > 0
  return (
    <div className={cn('rounded-card border border-slate-200 bg-white p-5 shadow-card', className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-slate-500">{label}</p>
          {loading ? (
            <div className="mt-2 h-7 w-24 animate-pulse rounded bg-slate-200" />
          ) : (
            <p className="mt-1 truncate text-2xl font-semibold text-slate-900">{value}</p>
          )}
        </div>
        {Icon && (
          <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-lg', ICON_TONES[tone])}>
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>
      {(trend !== undefined || hint) && (
        <div className="mt-3 flex items-center gap-1.5 text-xs">
          {trend !== undefined && trend !== null && (
            <span
              className={cn(
                'inline-flex items-center gap-0.5 font-medium',
                up ? 'text-success-700' : 'text-danger-700',
              )}
            >
              {up ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
              {Math.abs(trend)}%
            </span>
          )}
          {hint && <span className="text-slate-500">{hint}</span>}
        </div>
      )}
    </div>
  )
}
