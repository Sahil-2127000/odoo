import { ChevronLeft } from 'lucide-react'
import { Link } from 'react-router-dom'

/**
 * <PageHeader title="Leads" subtitle="All incoming enquiries" backTo="/sales"
 *             actions={<Button icon={Plus}>New lead</Button>} />
 */
export default function PageHeader({ title, subtitle, actions, backTo }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        {backTo && (
          <Link
            to={backTo}
            className="mb-1 inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-700"
          >
            <ChevronLeft className="h-3.5 w-3.5" /> Back
          </Link>
        )}
        <h1 className="truncate text-2xl font-semibold tracking-tight text-slate-900">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}
