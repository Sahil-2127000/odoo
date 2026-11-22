// Small top tab switcher for the technician portal (TechLayout has no sidebar).
import { NavLink } from 'react-router-dom'
import { cn } from '@/utils/cn'

// in the order the jobs happen: survey -> install -> service
const TABS = [
  { to: '/tech/surveys', label: 'Surveys' },
  { to: '/tech', label: 'Installations', end: true },
  { to: '/tech/complaints', label: 'Complaints' },
]

export default function TechTabs() {
  return (
    <div className="mb-4 flex gap-2 rounded-control bg-slate-200/60 p-1">
      {TABS.map((t) => (
        <NavLink
          key={t.to}
          to={t.to}
          end={t.end}
          className={({ isActive }) =>
            cn(
              'flex-1 rounded-control py-2 text-center text-sm font-medium transition-colors',
              isActive ? 'bg-white text-slate-900 shadow-card' : 'text-slate-600',
            )
          }
        >
          {t.label}
        </NavLink>
      ))}
    </div>
  )
}
