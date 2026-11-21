import { cn } from '@/utils/cn'

/**
 * Controlled tabs:
 * <Tabs value={tab} onChange={setTab}
 *       tabs={[{ value: 'all', label: 'All', count: 12 }, { value: 'open', label: 'Open' }]} />
 */
export default function Tabs({ tabs = [], value, onChange, className }) {
  return (
    <div className={cn('border-b border-slate-200', className)}>
      <nav className="-mb-px flex gap-6 overflow-x-auto" role="tablist">
        {tabs.map((t) => {
          const active = t.value === value
          return (
            <button
              key={t.value}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onChange?.(t.value)}
              className={cn(
                'flex cursor-pointer items-center gap-2 border-b-2 px-1 py-3 text-sm font-medium whitespace-nowrap transition-colors',
                active
                  ? 'border-primary-600 text-primary-700'
                  : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700',
              )}
            >
              {t.label}
              {t.count !== undefined && (
                <span
                  className={cn(
                    'rounded-full px-2 py-0.5 text-xs',
                    active ? 'bg-primary-100 text-primary-700' : 'bg-slate-100 text-slate-600',
                  )}
                >
                  {t.count}
                </span>
              )}
            </button>
          )
        })}
      </nav>
    </div>
  )
}
