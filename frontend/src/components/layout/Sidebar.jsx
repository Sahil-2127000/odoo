import { NavLink } from 'react-router-dom'
import { LogOut, Sun, X } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { NAV_BY_ROLE, ROLE_LABELS } from '@/config/nav'
import { cn } from '@/utils/cn'

export default function Sidebar({ open, onClose }) {
  const { role, logout } = useAuth()
  const items = NAV_BY_ROLE[role] ?? []

  return (
    <>
      {/* Mobile backdrop */}
      <div
        className={cn('fixed inset-0 z-30 bg-slate-900/50 lg:hidden', open ? 'block' : 'hidden')}
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-ink-900 text-slate-300 transition-transform duration-200 lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex h-16 items-center justify-between px-5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-500">
              <Sun className="h-5 w-5 text-white" />
            </div>
            <div className="leading-tight">
              <p className="text-sm font-semibold text-white">SunPower</p>
              <p className="text-[11px] text-slate-400">{ROLE_LABELS[role]} portal</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-md p-1 text-slate-400 hover:bg-ink-800 hover:text-white lg:hidden"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {items.map(({ label, to, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={onClose}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive ? 'bg-primary-500/15 text-primary-300' : 'hover:bg-ink-800 hover:text-white',
                )
              }
            >
              {Icon && <Icon className="h-4.5 w-4.5 shrink-0" />}
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-ink-800 p-3">
          <button
            type="button"
            onClick={logout}
            className="flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium hover:bg-ink-800 hover:text-white"
          >
            <LogOut className="h-4.5 w-4.5" />
            Log out
          </button>
        </div>
      </aside>
    </>
  )
}
