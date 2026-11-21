// TEMPORARY layout so Operations pages can be developed before Dev 2's AppLayout lands.
// Delete this file and mount operationsRoutes under Dev 2's layout at Checkpoint 1.
import { NavLink, Outlet } from 'react-router-dom'
import { operationsNav } from '../../../config/nav.operations'

export default function OpsDevLayout() {
  return (
    <div className="flex min-h-screen bg-slate-100">
      <aside className="w-60 shrink-0 border-r border-slate-200 bg-white">
        <div className="px-5 py-4">
          <p className="text-lg font-semibold text-slate-900">SunPower</p>
          <p className="text-xs text-slate-500">Operations (dev layout)</p>
        </div>
        <nav className="space-y-0.5 px-3">
          {operationsNav.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              className={({ isActive }) =>
                `block rounded-md px-3 py-2 text-sm ${isActive ? 'bg-amber-100 font-medium text-amber-900' : 'text-slate-700 hover:bg-slate-100'}`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <main className="min-w-0 flex-1 p-8">
        <Outlet />
      </main>
    </div>
  )
}
