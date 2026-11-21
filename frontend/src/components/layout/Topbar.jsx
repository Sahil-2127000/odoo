import { LogOut, Menu } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { ROLE_LABELS } from '@/constants/status'
import { initials } from '@/utils/format'

// White bar at the top: menu button (phones), user name and Log out.
export default function Topbar({ onMenuClick }) {
  const { user, role, logout } = useAuth()

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-slate-200 bg-white px-4 sm:px-6">
      <button type="button" onClick={onMenuClick} className="p-2 text-slate-500 lg:hidden" aria-label="Open menu">
        <Menu className="h-5 w-5" />
      </button>

      <div className="flex-1" />

      {/* Who is logged in */}
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-100 text-sm font-semibold text-primary-700">
          {initials(user?.name)}
        </span>
        <div className="hidden leading-tight sm:block">
          <p className="text-sm font-medium text-slate-900">{user?.name}</p>
          <p className="text-xs text-slate-500">{ROLE_LABELS[role]}</p>
        </div>
      </div>

      <button
        type="button"
        onClick={logout}
        className="ml-2 flex items-center gap-2 border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
      >
        <LogOut className="h-4 w-4" /> Log out
      </button>
    </header>
  )
}
