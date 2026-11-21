import { Link } from 'react-router-dom'
import { AlertTriangle, ArrowRight, CalendarClock, HardHat, LifeBuoy } from 'lucide-react'
import { getInstallations, getOrdersToFulfil, getProducts, getTechnicians, getTickets } from '@/api/operations'
import { Badge } from '@/components/ui'
import OpsPageShell, { ShellStatus } from './components/OpsPageShell'
import { useApiData } from './useApiData'
import { dayLabel, labelize, PRIORITY_TONE, TECH_STATUS_TONE } from './utils'

const DAY = 86400000
const OPEN_TICKET = ['open', 'assigned', 'in_progress']
const PRIORITIES = ['urgent', 'high', 'medium', 'low']

const loadOverview = async () => {
  const [products, installations, tickets, technicians, orders] = await Promise.all([
    getProducts(),
    getInstallations(),
    getTickets(),
    getTechnicians(),
    getOrdersToFulfil({}),
  ])
  // Read the clock here (not during render) so components stay pure.
  return { products, installations, tickets, technicians, orders, now: Date.now() }
}

function Panel({ title, icon: Icon, to, linkText, children }) {
  return (
    <section className="flex flex-col rounded-lg border border-slate-200 bg-white">
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
          <Icon className="h-4 w-4 text-slate-500" /> {title}
        </h2>
        <Link to={to} className="flex items-center gap-1 text-xs font-medium text-amber-700 hover:underline">
          {linkText} <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
      <div className="flex-1 p-4">{children}</div>
    </section>
  )
}

const Empty = ({ children }) => <p className="py-6 text-center text-sm text-slate-500">{children}</p>

// Order -> reserve -> schedule -> install, with live counts and links.
function Pipeline({ orders, installations, now }) {
  const today = new Date(now)
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString()
  const stages = [
    { label: 'Awaiting reservation', n: orders.filter((o) => o.status === 'confirmed').length, to: '/operations/fulfilment', tone: 'text-amber-600' },
    { label: 'Reserved, to schedule', n: orders.filter((o) => o.status === 'reserved').length, to: '/operations/installations', tone: 'text-sky-600' },
    { label: 'Scheduled', n: installations.filter((i) => i.status === 'scheduled').length, to: '/operations/installations', tone: 'text-sky-600' },
    { label: 'Crew on site', n: installations.filter((i) => i.status === 'in_progress').length, to: '/operations/installations', tone: 'text-amber-600' },
    {
      label: 'Installed this month',
      n: installations.filter((i) => i.status === 'completed' && i.completedAt >= monthStart).length,
      to: '/operations/warranties',
      tone: 'text-emerald-600',
    },
  ]
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
      {stages.map((s, i) => (
        <Link key={s.label} to={s.to} className="group relative rounded-lg border border-slate-200 bg-white p-4 hover:border-amber-300 hover:bg-amber-50/40">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{s.label}</p>
          <p className={`mt-1 text-2xl font-semibold ${s.tone}`}>{s.n}</p>
          {i < stages.length - 1 && <ArrowRight className="absolute top-1/2 -right-2.5 hidden h-4 w-4 -translate-y-1/2 text-slate-300 lg:block" />}
        </Link>
      ))}
    </div>
  )
}

function LowStock({ products }) {
  const low = products.filter((p) => p.isLowStock).sort((a, b) => a.inStock / (a.reorderLevel || 1) - b.inStock / (b.reorderLevel || 1))
  if (!low.length) return <Empty>All products above their reorder level.</Empty>
  return (
    <ul className="space-y-3">
      {low.slice(0, 6).map((p) => {
        const pct = Math.min(100, Math.round((p.inStock / (p.reorderLevel || 1)) * 100))
        return (
          <li key={p._id}>
            <div className="flex items-baseline justify-between gap-2 text-sm">
              <span className="truncate text-slate-800">{p.name}</span>
              <span className="shrink-0 text-xs text-slate-500">
                <span className="font-semibold text-red-600">{p.inStock}</span> / min {p.reorderLevel} {p.unit}
              </span>
            </div>
            <div className="mt-1 h-1.5 rounded-full bg-slate-100">
              <div className={`h-1.5 rounded-full ${pct < 50 ? 'bg-red-500' : 'bg-amber-500'}`} style={{ width: `${Math.max(pct, 3)}%` }} />
            </div>
          </li>
        )
      })}
      {low.length > 6 && <li className="text-xs text-slate-500">+ {low.length - 6} more</li>}
    </ul>
  )
}

function Upcoming({ installations, now }) {
  const until = new Date(now + 7 * DAY).toISOString()
  const jobs = installations.filter((i) => (i.status === 'scheduled' || i.status === 'in_progress') && i.scheduledDate <= until)
  if (!jobs.length) return <Empty>No installations in the next 7 days.</Empty>
  const groups = jobs.reduce((acc, j) => {
    const label = j.status === 'in_progress' ? 'On site now' : dayLabel(j.scheduledDate)
    ;(acc[label] ??= []).push(j)
    return acc
  }, {})
  return (
    <div className="space-y-3">
      {Object.entries(groups).map(([label, list]) => (
        <div key={label}>
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
          <ul className="space-y-1.5">
            {list.map((j) => (
              <li key={j._id} className="rounded-md bg-slate-50 px-3 py-2 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-slate-900">{j.customer?.name}</span>
                  <span className="text-xs text-slate-500">
                    {j.installationNumber} · {j.systemSizeKw} kW
                  </span>
                </div>
                <p className="truncate text-xs text-slate-500">Crew: {j.technicians.map((t) => t.name).join(', ')}</p>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}

function TicketsByPriority({ tickets }) {
  const open = tickets.filter((t) => OPEN_TICKET.includes(t.status))
  if (!open.length) return <Empty>No open tickets.</Empty>
  const max = Math.max(...PRIORITIES.map((p) => open.filter((t) => t.priority === p).length), 1)
  // Urgent before high, newest first within each.
  const hot = open
    .filter((t) => t.priority === 'urgent' || t.priority === 'high')
    .sort((a, b) => PRIORITIES.indexOf(a.priority) - PRIORITIES.indexOf(b.priority) || b.createdAt.localeCompare(a.createdAt))
  return (
    <div className="space-y-4">
      <ul className="space-y-2">
        {PRIORITIES.map((p) => {
          const n = open.filter((t) => t.priority === p).length
          return (
            <li key={p} className="flex items-center gap-3 text-sm">
              <span className="w-16 shrink-0">
                <Badge tone={PRIORITY_TONE[p]} dot={false}>
                  {labelize(p)}
                </Badge>
              </span>
              <span className="h-2 flex-1 rounded-full bg-slate-100">
                <span className="block h-2 rounded-full bg-slate-400" style={{ width: `${(n / max) * 100}%` }} />
              </span>
              <span className="w-6 text-right font-semibold text-slate-900">{n}</span>
            </li>
          )
        })}
      </ul>
      {hot.length > 0 && (
        <ul className="space-y-1.5 border-t border-slate-100 pt-3">
          {hot.map((t) => (
            <li key={t._id} className="flex items-start justify-between gap-2 text-sm">
              <span className="min-w-0">
                <span className="block truncate text-slate-900">{t.subject}</span>
                <span className="text-xs text-slate-500">
                  {t.ticketNumber} · {t.customer?.name} · {t.assignedTechnician?.name ?? <span className="text-red-600">unassigned</span>}
                </span>
              </span>
              <Badge status={t.status} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function Crew({ technicians }) {
  const statuses = ['available', 'on_job', 'leave']
  return (
    <div className="space-y-3">
      {statuses.map((s) => {
        const list = technicians.filter((t) => t.status === s)
        return (
          <div key={s}>
            <p className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              {labelize(s)} <span className="rounded-full bg-slate-100 px-1.5 text-slate-700">{list.length}</span>
            </p>
            <div className="flex flex-wrap gap-1.5">
              {list.length ? (
                list.map((t) => (
                  <Badge key={t._id} tone={TECH_STATUS_TONE[s]} dot={false}>
                    {t.name}
                  </Badge>
                ))
              ) : (
                <span className="text-xs text-slate-400">None</span>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default function OverviewPage() {
  const { data, loading, error } = useApiData(loadOverview)

  return (
    <OpsPageShell title="Operations Overview" description="Today's picture: what needs stock, who is on site, which complaints are open, and who is free.">
      <ShellStatus loading={loading && !data} error={error}>
        {data && (
          <>
            <Pipeline orders={data.orders} installations={data.installations} now={data.now} />

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <Panel title="Low-stock alerts" icon={AlertTriangle} to="/operations/inventory" linkText="Stock in">
                <LowStock products={data.products} />
              </Panel>
              <Panel title="Installations: next 7 days" icon={CalendarClock} to="/operations/installations" linkText="Board">
                <Upcoming installations={data.installations} now={data.now} />
              </Panel>
              <Panel title="Open tickets by priority" icon={LifeBuoy} to="/operations/tickets" linkText="Tickets">
                <TicketsByPriority tickets={data.tickets} />
              </Panel>
              <Panel title="Technician availability" icon={HardHat} to="/operations/technicians" linkText="Crew">
                <Crew technicians={data.technicians} />
              </Panel>
            </div>
          </>
        )}
      </ShellStatus>
    </OpsPageShell>
  )
}
