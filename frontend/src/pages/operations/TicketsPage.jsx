import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { getCustomers, getSerialItems, getTechnicians, getTickets, TICKET_PRIORITIES, TICKET_TYPES } from '@/api/operations'
import { Badge, Button } from '@/components/ui'
import OpsPageShell, { ShellStatus, StatCard } from './components/OpsPageShell'
import TicketDetailModal from './components/TicketDetailModal'
import TicketFormModal from './components/TicketFormModal'
import { inputClass } from './components/ui'
import { useApiData } from './useApiData'
import { dayLabel, labelize, PRIORITY_TONE } from './utils'

const loadData = async () => {
  const [tickets, technicians, customers, serials] = await Promise.all([getTickets(), getTechnicians(), getCustomers(), getSerialItems()])
  return { tickets, technicians, customers, serials }
}

const OPEN = ['open', 'assigned', 'in_progress']
const TABS = [
  { key: 'active', label: 'Active', match: (t) => OPEN.includes(t.status) },
  { key: 'unassigned', label: 'Unassigned', match: (t) => t.status === 'open' },
  { key: 'done', label: 'Resolved / closed', match: (t) => !OPEN.includes(t.status) },
  { key: 'all', label: 'All', match: () => true },
]
const PRIORITY_RANK = { urgent: 0, high: 1, medium: 2, low: 3 }

export default function TicketsPage() {
  const { data, loading, error, reload } = useApiData(loadData)
  const [params, setParams] = useSearchParams()
  const serialParam = params.get('serial')
  const [tab, setTab] = useState('active')
  const [priority, setPriority] = useState('')
  const [type, setType] = useState('')
  const [q, setQ] = useState('')
  const [creating, setCreating] = useState(false)
  const [selectedId, setSelectedId] = useState(null)

  const tickets = useMemo(() => data?.tickets ?? [], [data])
  const count = (key) => tickets.filter(TABS.find((t) => t.key === key).match).length
  const urgentOpen = tickets.filter((t) => OPEN.includes(t.status) && ['urgent', 'high'].includes(t.priority)).length

  // Most urgent first, then newest.
  const visible = useMemo(() => {
    const term = q.trim().toLowerCase()
    const match = TABS.find((t) => t.key === tab).match
    return tickets
      .filter(
        (t) =>
          match(t) &&
          (!priority || t.priority === priority) &&
          (!type || t.type === type) &&
          (!term || [t.ticketNumber, t.subject, t.customer?.name, t.serialItem?.serialNumber].some((v) => v?.toLowerCase().includes(term))),
      )
      .sort((a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority] || b.createdAt.localeCompare(a.createdAt))
  }, [tickets, tab, priority, type, q])

  // "Raise ticket" from Warranties / Serial Lookup arrives as ?serial=XYZ and opens a pre-filled form.
  const linkedSerial = serialParam && data ? data.serials.find((s) => s.serialNumber === serialParam) : null
  const formOpen = creating || Boolean(linkedSerial)
  const prefill = linkedSerial ? { customer: linkedSerial.customer?._id, serialItem: linkedSerial._id } : null
  const closeForm = () => {
    setCreating(false)
    if (serialParam) setParams({}, { replace: true })
  }

  const selected = tickets.find((t) => t._id === selectedId)

  return (
    <OpsPageShell title="Service Tickets" description="Complaints, service visits and warranty claims. A ticket stays open until the customer confirms everything works.">
      <ShellStatus loading={loading && !data} error={error}>
        {data && (
          <>
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <StatCard label="Active" value={count('active')} tone="amber" />
              <StatCard label="Unassigned" value={count('unassigned')} tone={count('unassigned') ? 'red' : 'green'} />
              <StatCard label="Urgent / high" value={urgentOpen} tone={urgentOpen ? 'red' : 'green'} />
              <StatCard label="Resolved / closed" value={count('done')} tone="green" />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex flex-wrap gap-2">
                {TABS.map((t) => (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => setTab(t.key)}
                    className={`rounded-full px-3 py-1 text-xs font-medium ${tab === t.key ? 'bg-slate-800 text-white' : 'bg-white text-slate-700 ring-1 ring-slate-200'}`}
                  >
                    {t.label} {count(t.key)}
                  </button>
                ))}
              </div>
              <select className={`${inputClass} max-w-[150px]`} value={priority} onChange={(e) => setPriority(e.target.value)}>
                <option value="">Any priority</option>
                {TICKET_PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {labelize(p)}
                  </option>
                ))}
              </select>
              <select className={`${inputClass} max-w-[170px]`} value={type} onChange={(e) => setType(e.target.value)}>
                <option value="">Any type</option>
                {TICKET_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {labelize(t)}
                  </option>
                ))}
              </select>
              <input className={`${inputClass} max-w-xs`} placeholder="Search ticket, customer or serial" value={q} onChange={(e) => setQ(e.target.value)} />
              <Button className="ml-auto" icon={Plus} onClick={() => setCreating(true)}>
                Raise ticket
              </Button>
            </div>

            <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Ticket</th>
                    <th className="px-4 py-3">Customer / unit</th>
                    <th className="px-4 py-3">Priority</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Technician</th>
                    <th className="px-4 py-3">Billing</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {visible.map((t) => (
                    <tr key={t._id} onClick={() => setSelectedId(t._id)} className="cursor-pointer hover:bg-amber-50/50">
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-900">{t.subject}</p>
                        <p className="text-xs text-slate-500">
                          {t.ticketNumber} · {labelize(t.type)} · {dayLabel(t.createdAt)}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-slate-900">{t.customer?.name}</p>
                        <p className="font-mono text-xs text-slate-500">{t.serialItem?.serialNumber ?? '-'}</p>
                      </td>
                      <td className="px-4 py-3">
                        <Badge tone={PRIORITY_TONE[t.priority]}>{labelize(t.priority)}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge status={t.status} />
                      </td>
                      <td className="px-4 py-3 text-slate-700">{t.assignedTechnician?.name ?? <span className="text-red-600">Unassigned</span>}</td>
                      <td className="px-4 py-3">
                        <Badge tone={t.isBillable ? 'red' : 'green'} dot={false}>
                          {t.isBillable ? 'Billable' : 'Free'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                  {visible.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-10 text-center text-sm text-slate-500">
                        No tickets match.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </ShellStatus>

      {formOpen && data && (
        <TicketFormModal
          key={linkedSerial?._id ?? 'new'}
          customers={data.customers}
          serials={data.serials}
          prefill={prefill}
          onClose={closeForm}
          onCreated={(t) => {
            closeForm()
            setTab('active')
            setSelectedId(t._id)
            reload()
          }}
        />
      )}

      {selected && (
        <TicketDetailModal
          key={selected._id}
          ticket={selected}
          technicians={data.technicians}
          onClose={() => setSelectedId(null)}
          onChanged={() => reload()}
        />
      )}
    </OpsPageShell>
  )
}
