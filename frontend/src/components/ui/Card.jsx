import { cn } from '@/utils/cn'

/**
 * <Card title="Monthly revenue" subtitle="Last 6 months" actions={<Button/>} padding>
 *   ...
 * </Card>
 */
export default function Card({ title, subtitle, actions, padding = true, className, bodyClassName, children }) {
  const hasHeader = title || subtitle || actions
  return (
    <div className={cn('rounded-card border border-slate-200 bg-white shadow-card', className)}>
      {hasHeader && (
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div className="min-w-0">
            {title && <h3 className="text-sm font-semibold text-slate-900">{title}</h3>}
            {subtitle && <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className={cn(padding && 'p-5', bodyClassName)}>{children}</div>
    </div>
  )
}
