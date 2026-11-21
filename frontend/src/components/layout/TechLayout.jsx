import { Outlet } from 'react-router-dom'
import { LogOut, Sun } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'

/**
 * Simple phone layout for technicians: no sidebar, just a top bar and a narrow page.
 * The current page is drawn where <Outlet /> is.
 */
export default function TechLayout() {
  const { user, logout } = useAuth()

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="sticky top-0 z-20 bg-slate-950 text-white">
        <div className="mx-auto flex h-14 max-w-md items-center justify-between px-4">
          <div>
            <p className="flex items-center gap-1.5 font-display text-xl font-extrabold uppercase">
              <Sun className="h-4 w-4 text-amber-400" /> SolarConnect
            </p>
            <p className="text-xs text-slate-400">{user?.name}</p>
          </div>
          <button type="button" onClick={logout} className="flex items-center gap-1.5 text-sm text-slate-300">
            <LogOut className="h-4 w-4" /> Log out
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-md px-4 py-5">
        <Outlet />
      </main>
    </div>
  )
}
