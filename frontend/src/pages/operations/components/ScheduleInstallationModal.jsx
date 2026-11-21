import { useState } from 'react'
import { scheduleInstallation } from '@/api/operations'
import { Badge, Button, Modal, useToast } from '@/components/ui'
import { labelize, TECH_STATUS_TONE } from '../utils'
import { inputClass } from './ui'

// yyyy-mm-dd in local time (what <input type="date"> uses)
const toDateInput = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
const tomorrow = () => {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return toDateInput(d)
}

// orders = reserved orders; orderId = preselected order (from its "Schedule" button)
export default function ScheduleInstallationModal({ orders, technicians, orderId, onClose, onScheduled }) {
  const toast = useToast()
  const [form, setForm] = useState({ order: orderId ?? orders[0]?._id ?? '', date: tomorrow(), technicians: [], notes: '' })
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)

  const order = orders.find((o) => o._id === form.order)
  const toggleTech = (id) =>
    setForm((f) => ({ ...f, technicians: f.technicians.includes(id) ? f.technicians.filter((t) => t !== id) : [...f.technicians, id] }))

  // Available first, then on job, then on leave.
  const rank = { available: 0, on_job: 1, leave: 2 }
  const sortedTechs = [...technicians].sort((a, b) => rank[a.status] - rank[b.status] || a.name.localeCompare(b.name))
  const busyPicked = technicians.filter((t) => form.technicians.includes(t._id) && t.status === 'on_job')

  const submit = async () => {
    const e = {}
    if (!form.order) e.order = 'Pick an order'
    if (!form.date) e.date = 'Pick a date'
    else if (form.date < toDateInput(new Date())) e.date = 'Date cannot be in the past'
    if (!form.technicians.length) e.technicians = 'Assign at least one technician'
    setErrors(e)
    if (Object.keys(e).length) return

    setSaving(true)
    try {
      // Store as 09:00 local time on the chosen day.
      const scheduledDate = new Date(`${form.date}T09:00:00`).toISOString()
      const inst = await scheduleInstallation({ order: form.order, scheduledDate, technicians: form.technicians, notes: form.notes.trim() })
      toast.success(`${inst.installationNumber} scheduled for ${order.customer.name}`)
      onScheduled()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open
      size="lg"
      onClose={onClose}
      title="Schedule installation"
      description="Only orders with stock reserved can be scheduled."
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit} loading={saving} disabled={!orders.length}>
            Schedule
          </Button>
        </>
      }
    >
      {orders.length === 0 ? (
        <p className="text-sm text-slate-600">No reserved orders. Reserve stock for an order on the Orders to Fulfil page first.</p>
      ) : (
        <div className="space-y-4">
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Order</span>
            <select className={`${inputClass} mt-1`} value={form.order} onChange={(e) => setForm((f) => ({ ...f, order: e.target.value }))}>
              {orders.map((o) => (
                <option key={o._id} value={o._id}>
                  {o.orderNumber} · {o.customer.name} · {o.systemSizeKw} kW
                </option>
              ))}
            </select>
            {errors.order && <p className="mt-1 text-xs text-red-600">{errors.order}</p>}
          </label>

          {order && (
            <p className="rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-600">
              Site: <span className="text-slate-900">{order.customer.address}</span> · {order.customer.phone}
            </p>
          )}

          <label className="block max-w-xs">
            <span className="text-sm font-medium text-slate-700">Installation date</span>
            <input
              type="date"
              className={`${inputClass} mt-1`}
              value={form.date}
              min={toDateInput(new Date())}
              onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
            />
            {errors.date && <p className="mt-1 text-xs text-red-600">{errors.date}</p>}
          </label>

          <div>
            <p className="text-sm font-medium text-slate-700">
              Crew <span className="font-normal text-slate-500">({form.technicians.length} selected)</span>
            </p>
            <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {sortedTechs.map((t) => {
                const on = form.technicians.includes(t._id)
                const onLeave = t.status === 'leave'
                return (
                  <label
                    key={t._id}
                    className={`flex items-center gap-3 rounded-md border px-3 py-2 text-sm ${
                      onLeave ? 'cursor-not-allowed border-slate-200 bg-slate-50 text-slate-400' : on ? 'cursor-pointer border-amber-400 bg-amber-50' : 'cursor-pointer border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <input type="checkbox" className="accent-amber-500" checked={on} disabled={onLeave} onChange={() => toggleTech(t._id)} />
                    <span className="flex-1">
                      <span className="font-medium text-slate-900">{t.name}</span>
                      <span className="block text-xs text-slate-500">{t.skills.map(labelize).join(', ')}</span>
                    </span>
                    <Badge tone={TECH_STATUS_TONE[t.status]} dot={false}>
                      {labelize(t.status)}
                    </Badge>
                  </label>
                )
              })}
            </div>
            {errors.technicians && <p className="mt-1 text-xs text-red-600">{errors.technicians}</p>}
            {busyPicked.length > 0 && (
              <p className="mt-2 text-xs text-amber-700">
                {busyPicked.map((t) => t.name).join(', ')} {busyPicked.length > 1 ? 'are' : 'is'} on another job right now. Fine for a future date; check for today.
              </p>
            )}
          </div>

          <label className="block">
            <span className="text-sm font-medium text-slate-700">Notes for the crew (optional)</span>
            <textarea
              className={`${inputClass} mt-1 h-20`}
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              placeholder="e.g. Call customer 1 hour before. Roof access via side staircase."
            />
          </label>
        </div>
      )}
    </Modal>
  )
}
