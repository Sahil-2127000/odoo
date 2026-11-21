import { useState } from 'react'
import { Link } from 'react-router-dom'
import { assignTicket, setTicketStatus } from '@/api/operations'
import { Badge, Button, Modal, useToast } from '@/components/ui'
import { formatDate, labelize, PRIORITY_TONE, TECH_STATUS_TONE } from '../utils'
import { inputClass } from './ui'

const STEPS = ['open', 'assigned', 'in_progress', 'resolved', 'closed']
const STEP_LABEL = { open: 'Raised', assigned: 'Assigned', in_progress: 'Work started', resolved: 'Resolved', closed: 'Customer confirmed' }

function Progress({ status }) {
  const at = STEPS.indexOf(status)
  return (
    <ol className="flex flex-wrap items-center gap-1.5 text-xs">
      {STEPS.map((s, i) => (
        <li key={s} className="flex items-center gap-1.5">
          <span className={`rounded-full px-2 py-0.5 ${i <= at ? 'bg-amber-500 font-medium text-white' : 'bg-slate-100 text-slate-500'}`}>{STEP_LABEL[s]}</span>
          {i < STEPS.length - 1 && <span className={`h-px w-3 ${i < at ? 'bg-amber-500' : 'bg-slate-300'}`} />}
        </li>
      ))}
    </ol>
  )
}

export default function TicketDetailModal({ ticket, technicians, onClose, onChanged }) {
  const toast = useToast()
  const [techId, setTechId] = useState(ticket.assignedTechnician?._id ?? '')
  const [notes, setNotes] = useState(ticket.resolutionNotes ?? '')
  const [busy, setBusy] = useState('')
  const [notesError, setNotesError] = useState('')

  const run = async (key, fn, message) => {
    setBusy(key)
    try {
      const updated = await fn()
      toast.success(message)
      onChanged(updated)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setBusy('')
    }
  }

  const assign = () => {
    const tech = technicians.find((t) => t._id === techId)
    run('assign', () => assignTicket(ticket._id, techId), `${ticket.ticketNumber} assigned to ${tech?.name}`)
  }

  const moveTo = (status) => {
    if (status === 'resolved' && !notes.trim()) {
      setNotesError('Write what was done before resolving')
      return
    }
    setNotesError('')
    const messages = {
      in_progress: `${ticket.ticketNumber}: work started`,
      resolved: `${ticket.ticketNumber} resolved`,
      closed: `${ticket.ticketNumber} closed: customer confirmed`,
    }
    run(status, () => setTicketStatus(ticket._id, status, notes.trim() || undefined), messages[status] ?? 'Ticket updated')
  }

  const s = ticket.status
  const finished = s === 'resolved' || s === 'closed'

  return (
    <Modal
      open
      size="lg"
      onClose={onClose}
      title={`${ticket.ticketNumber} · ${ticket.subject}`}
      description={`Raised ${formatDate(ticket.createdAt)}${ticket.resolvedAt ? ` · resolved ${formatDate(ticket.resolvedAt)}` : ''}`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
          {s === 'assigned' && (
            <Button loading={busy === 'in_progress'} onClick={() => moveTo('in_progress')}>
              Start work
            </Button>
          )}
          {(s === 'assigned' || s === 'in_progress') && (
            <Button variant={s === 'assigned' ? 'secondary' : 'primary'} loading={busy === 'resolved'} onClick={() => moveTo('resolved')}>
              Mark resolved
            </Button>
          )}
          {s === 'resolved' && (
            <>
              <Button variant="secondary" loading={busy === 'reopen'} onClick={() => run('reopen', () => setTicketStatus(ticket._id, 'in_progress'), `${ticket.ticketNumber} reopened`)}>
                Reopen
              </Button>
              <Button loading={busy === 'closed'} onClick={() => moveTo('closed')}>
                Customer confirmed, close
              </Button>
            </>
          )}
        </>
      }
    >
      <div className="space-y-4 text-sm">
        <Progress status={s} />

        <div className="flex flex-wrap gap-2">
          <Badge status={s} />
          <Badge tone={PRIORITY_TONE[ticket.priority]}>{labelize(ticket.priority)} priority</Badge>
          <Badge tone="gray" dot={false}>
            {labelize(ticket.type)}
          </Badge>
          <Badge tone={ticket.isBillable ? 'red' : 'green'} dot={false}>
            {ticket.isBillable ? 'Billable' : 'Free (under warranty)'}
          </Badge>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-md bg-slate-50 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Customer</p>
            <p className="mt-1 font-medium text-slate-900">{ticket.customer?.name}</p>
            <p className="text-slate-600">{ticket.customer?.phone}</p>
            <p className="text-xs text-slate-500">{ticket.customer?.address}</p>
          </div>
          <div className="rounded-md bg-slate-50 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Unit</p>
            {ticket.serialItem ? (
              <>
                <Link to={`/operations/serials/${encodeURIComponent(ticket.serialItem.serialNumber)}`} className="mt-1 block font-mono text-amber-700 hover:underline">
                  {ticket.serialItem.serialNumber}
                </Link>
                <p className="text-slate-600">
                  Warranty {ticket.warranty ? `${ticket.warranty.status} until ${formatDate(ticket.warranty.endDate)}` : 'none'}
                </p>
              </>
            ) : (
              <p className="mt-1 text-slate-500">Not linked to a specific unit.</p>
            )}
          </div>
        </div>

        {ticket.description && <p className="whitespace-pre-line text-slate-700">{ticket.description}</p>}

        {!finished && (
          <div className="rounded-md border border-slate-200 p-3">
            <p className="font-medium text-slate-900">Technician</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <select className={`${inputClass} max-w-xs`} value={techId} onChange={(e) => setTechId(e.target.value)}>
                <option value="">Select technician...</option>
                {technicians.map((t) => (
                  <option key={t._id} value={t._id} disabled={t.status === 'leave'}>
                    {t.name} · {labelize(t.status)}
                  </option>
                ))}
              </select>
              <Button
                variant={s === 'open' ? 'primary' : 'secondary'}
                disabled={!techId || techId === ticket.assignedTechnician?._id}
                loading={busy === 'assign'}
                onClick={assign}
              >
                {ticket.assignedTechnician ? 'Reassign' : 'Assign'}
              </Button>
            </div>
            {ticket.assignedTechnician && (
              <p className="mt-2 flex items-center gap-2 text-xs text-slate-600">
                Currently: {ticket.assignedTechnician.name}
                <Badge tone={TECH_STATUS_TONE[ticket.assignedTechnician.status]} dot={false}>
                  {labelize(ticket.assignedTechnician.status)}
                </Badge>
              </p>
            )}
          </div>
        )}

        {(s === 'assigned' || s === 'in_progress' || finished) && (
          <label className="block">
            <span className="font-medium text-slate-900">Resolution notes</span>
            {finished ? (
              <p className="mt-1 whitespace-pre-line rounded-md bg-emerald-50 px-3 py-2 text-emerald-900">{ticket.resolutionNotes || '-'}</p>
            ) : (
              <>
                <textarea
                  className={`${inputClass} mt-1 h-20`}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="What was found and done, parts replaced, test result..."
                />
                {notesError && <p className="mt-1 text-xs text-red-600">{notesError}</p>}
              </>
            )}
          </label>
        )}
        {finished && ticket.assignedTechnician && <p className="text-xs text-slate-500">Handled by {ticket.assignedTechnician.name}</p>}
      </div>
    </Modal>
  )
}
