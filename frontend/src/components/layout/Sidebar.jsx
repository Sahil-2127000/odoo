import { NavLink } from 'react-router-dom'
import { Sun, X } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { NAV_BY_ROLE } from '@/config/nav'
import { ROLE_LABELS } from '@/constants/status'

/**
 * Dark menu on the left with the links for the logged-in role.
 * On phones it slides in when `open` is true.
 */
export default function Sidebar({ open, onClose }) {
  const { role } = useAuth()
  const links = NAV_BY_ROLE[role] || []

  return (
    <>
      {/* Dark background behind the menu on phones */}
      {open && <div className="fixed inset-0 z-30 bg-slate-900/50 lg:hidden" onClick={onClose} />}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-slate-950 text-slate-300 transition-transform lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-between px-5">
          <div>
            <p className="flex items-center gap-2 font-display text-2xl font-extrabold text-white uppercase">
              <Sun className="h-5 w-5 text-amber-400" /> SolarConnect
            </p>
            <p className="text-xs text-slate-500">{ROLE_LABELS[role]} portal</p>
          </div>
          <button type="button" onClick={onClose} className="p-1 text-slate-400 lg:hidden" aria-label="Close menu">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Links */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {links.map(({ label, to, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 text-sm font-medium ${
                  isActive ? 'bg-primary-500 text-white' : 'hover:bg-white/10 hover:text-white'
                }`
              }
            >
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  )
}
