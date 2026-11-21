import { useState } from 'react'
import { CalendarPlus } from 'lucide-react'
import { completeInstallation, getInstallations, getOrdersToFulfil, getTechnicians, setInstallationStatus } from '@/api/operations'
import { Button, ConfirmDialog, useToast } from '@/components/ui'
import InstallationCard from './components/InstallationCard'
import OpsPageShell, { ShellStatus, StatCard } from './components/OpsPageShell'
import ScheduleInstallationModal from './components/ScheduleInstallationModal'
import { useApiData } from './useApiData'
import { dayLabel } from './utils'

const loadData = async () => {
  const [installations, reservedOrders, technicians] = await Promise.all([
    getInstallations(),
    getOrdersToFulfil({ status: 'reserved' }),
    getTechnicians(),
  ])
  return { installations, reservedOrders, technicians }
}

const COLUMNS = [
  { status: 'scheduled', title: 'Scheduled', accent: 'border-t-sky-500', empty: 'Nothing scheduled.' },
  { status: 'in_progress', title: 'In progress', accent: 'border-t-amber-500', empty: 'No crew on site right now.' },
  { status: 'completed', title: 'Completed', accent: 'border-t-emerald-500', empty: 'No completed jobs yet.' },
]

// [{ label: 'Today', items: [...] }, ...] keeping the incoming order.
const groupByDay = (items, dateOf) =>
  items.reduce((groups, inst) => {
    const label = dayLabel(dateOf(inst))
    const last = groups[groups.length - 1]
    if (last?.label === label) last.items.push(inst)
    else groups.push({ label, items: [inst] })
    return groups
  }, [])

export default function InstallationsPage() {
  const toast = useToast()
  const { data, loading, error, reload } = useApiData(loadData)
  const [scheduling, setScheduling] = useState(null) // { orderId } or null
  const [confirming, setConfirming] = useState(null) // installation to complete
  const [busyId, setBusyId] = useState(null)

  const list = data?.installations ?? []
  const count = (s) => list.filter((i) => i.status === s).length

  const columnItems = (status) => {
    const items = list.filter((i) => i.status === status)
    // Completed: newest first. Others: soonest first (API already sorts ascending).
    return status === 'completed' ? [...items].sort((a, b) => b.completedAt.localeCompare(a.completedAt)) : items
  }

  const start = async (inst) => {
    setBusyId(inst._id)
    try {
      await setInstallationStatus(inst._id, 'in_progress')
      toast.success(`${inst.installationNumber} started: crew marked on job`)
      reload()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setBusyId(null)
    }
  }

  const complete = async () => {
    const inst = confirming
    setBusyId(inst._id)
    try {
      const res = await completeInstallation(inst._id)
      toast.success(`${inst.installationNumber} completed: ${res.warrantiesCreated} warranties activated`)
      setConfirming(null)
      reload()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setBusyId(null)
    }
  }

  return (
    <OpsPageShell title="Installations" description="Schedule a crew for each reserved order and track the job to completion. Completing a job activates the warranty on every installed serial.">
      <ShellStatus loading={loading && !data} error={error}>
        {data && (
          <>
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <StatCard label="Ready to schedule" value={data.reservedOrders.length} tone="amber" />
              <StatCard label="Scheduled" value={count('scheduled')} tone="blue" />
              <StatCard label="In progress" value={count('in_progress')} tone="amber" />
              <StatCard label="Completed" value={count('completed')} tone="green" />
            </div>

            {data.reservedOrders.length > 0 && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                <p className="text-sm font-medium text-amber-900">Stock reserved, waiting for a crew</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {data.reservedOrders.map((o) => (
                    <Button key={o._id} size="sm" variant="secondary" icon={CalendarPlus} onClick={() => setScheduling({ orderId: o._id })}>
                      {o.orderNumber} · {o.customer.name}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end">
              <Button icon={CalendarPlus} onClick={() => setScheduling({ orderId: null })}>
                Schedule installation
              </Button>
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              {COLUMNS.map((col) => {
                const items = columnItems(col.status)
                const groups = groupByDay(items, (i) => (col.status === 'completed' ? i.completedAt : i.scheduledDate))
                return (
                  <section key={col.status} className={`rounded-lg border border-t-4 border-slate-200 bg-slate-50 p-3 ${col.accent}`}>
                    <h2 className="flex items-center justify-between text-sm font-semibold text-slate-900">
                      {col.title}
                      <span className="rounded-full bg-white px-2 py-0.5 text-xs font-medium text-slate-600 ring-1 ring-slate-200">{items.length}</span>
                    </h2>
                    <div className="mt-3 space-y-4">
                      {groups.length === 0 && <p className="py-6 text-center text-xs text-slate-500">{col.empty}</p>}
                      {groups.map((g) => (
                        <div key={g.label}>
                          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{g.label}</p>
                          <div className="space-y-2">
                            {g.items.map((inst) => (
                              <InstallationCard key={inst._id} inst={inst} busy={busyId === inst._id} onStart={start} onComplete={setConfirming} />
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )
              })}
            </div>
          </>
        )}
      </ShellStatus>

      {scheduling && (
        <ScheduleInstallationModal
          orders={data.reservedOrders}
          technicians={data.technicians}
          orderId={scheduling.orderId}
          onClose={() => setScheduling(null)}
          onScheduled={() => {
            setScheduling(null)
            reload()
          }}
        />
      )}

      <ConfirmDialog
        open={Boolean(confirming)}
        title={`Complete ${confirming?.installationNumber ?? ''}?`}
        message={`This confirms the system at ${confirming?.customer?.name ?? 'the site'} is installed and tested. Every serial-numbered unit on the order becomes "installed", its warranty starts today, and the crew is set back to available.`}
        confirmText="Mark complete"
        danger={false}
        loading={busyId === confirming?._id}
        onConfirm={complete}
        onClose={() => setConfirming(null)}
      />
    </OpsPageShell>
  )
}
