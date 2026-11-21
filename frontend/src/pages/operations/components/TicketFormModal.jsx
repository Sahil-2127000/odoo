import { useState } from 'react'
import { ShieldAlert, ShieldCheck } from 'lucide-react'
import { createTicket, TICKET_PRIORITIES, TICKET_TYPES } from '@/api/operations'
import { Button, Modal, useToast } from '@/components/ui'
import { formatDate, labelize } from '../utils'
import { inputClass } from './ui'

const TYPE_HINT = {
  complaint: 'Something is not working as expected.',
  service: 'Planned visit: cleaning, health check, re-tightening.',
  warranty_claim: 'Faulty unit to be repaired or replaced under warranty.',
}

// serials = all serial items (populated); only installed ones with a customer are offered.
// prefill = { customer, serialItem } from a "Raise ticket" link.
export default function TicketFormModal({ customers, serials, prefill, onClose, onCreated }) {
  const toast = useToast()
  const [form, setForm] = useState({
    customer: prefill?.customer ?? '',
    serialItem: prefill?.serialItem ?? '',
    type: prefill?.serialItem ? 'warranty_claim' : 'complaint',
    priority: 'medium',
    subject: '',
    description: '',
  })
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))
  const customerSerials = serials.filter((s) => s.customer?._id === form.customer && s.status === 'installed')
  const serial = serials.find((s) => s._id === form.serialItem)
  const warranty = serial?.warranty
  const underWarranty = warranty?.status === 'active'

  const changeCustomer = (e) => setForm((f) => ({ ...f, customer: e.target.value, serialItem: '' }))

  const submit = async () => {
    const e = {}
    if (!form.customer) e.customer = 'Pick a customer'
    if (!form.subject.trim()) e.subject = 'Describe the problem in a few words'
    if (form.type === 'warranty_claim' && !form.serialItem) e.serialItem = 'A warranty claim needs the faulty unit'
    setErrors(e)
    if (Object.keys(e).length) return

    setSaving(true)
    try {
      const t = await createTicket({
        customer: form.customer,
        serialItem: form.serialItem || undefined,
        type: form.type,
        priority: form.priority,
        subject: form.subject.trim(),
        description: form.description.trim(),
      })
      toast.success(`${t.ticketNumber} raised${t.isBillable ? ' (billable)' : ' (free, under warranty)'}`)
      onCreated(t)
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
      title="Raise service ticket"
      description="Tracked until the customer confirms everything works."
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit} loading={saving}>
            Raise ticket
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="block sm:col-span-2">
          <span className="text-sm font-medium text-slate-700">Customer</span>
          <select className={`${inputClass} mt-1`} value={form.customer} onChange={changeCustomer}>
            <option value="">Select customer...</option>
            {customers.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name} · {c.phone}
              </option>
            ))}
          </select>
          {errors.customer && <p className="mt-1 text-xs text-red-600">{errors.customer}</p>}
        </label>

        <label className="block sm:col-span-2">
          <span className="text-sm font-medium text-slate-700">Unit with the problem (optional)</span>
          <select className={`${inputClass} mt-1 font-mono`} value={form.serialItem} onChange={set('serialItem')} disabled={!form.customer}>
            <option value="">{form.customer ? (customerSerials.length ? 'Not specific to one unit' : 'No units installed for this customer') : 'Pick a customer first'}</option>
            {customerSerials.map((s) => (
              <option key={s._id} value={s._id}>
                {s.serialNumber} · {s.product.name}
              </option>
            ))}
          </select>
          {errors.serialItem && <p className="mt-1 text-xs text-red-600">{errors.serialItem}</p>}
        </label>

        {serial && (
          <div
            className={`flex items-start gap-2 rounded-md px-3 py-2 text-sm sm:col-span-2 ${
              underWarranty ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-700'
            }`}
          >
            {underWarranty ? <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" /> : <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />}
            <span>
              {warranty
                ? underWarranty
                  ? `Under warranty until ${formatDate(warranty.endDate)}: repair or replacement is free.`
                  : `Warranty expired on ${formatDate(warranty.endDate)}: parts and labour will be billed.`
                : 'No warranty on this unit: parts and labour will be billed.'}
              {form.type === 'warranty_claim' && !underWarranty && <span className="block font-medium">Consider type "Complaint" instead of a warranty claim.</span>}
            </span>
          </div>
        )}

        <label className="block">
          <span className="text-sm font-medium text-slate-700">Type</span>
          <select className={`${inputClass} mt-1`} value={form.type} onChange={set('type')}>
            {TICKET_TYPES.map((t) => (
              <option key={t} value={t}>
                {labelize(t)}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-slate-500">{TYPE_HINT[form.type]}</p>
        </label>

        <label className="block">
          <span className="text-sm font-medium text-slate-700">Priority</span>
          <select className={`${inputClass} mt-1`} value={form.priority} onChange={set('priority')}>
            {TICKET_PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {labelize(p)}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-slate-500">Urgent = no power at site.</p>
        </label>

        <label className="block sm:col-span-2">
          <span className="text-sm font-medium text-slate-700">Subject</span>
          <input className={`${inputClass} mt-1`} value={form.subject} onChange={set('subject')} placeholder="Inverter showing fault code, zero generation" />
          {errors.subject && <p className="mt-1 text-xs text-red-600">{errors.subject}</p>}
        </label>

        <label className="block sm:col-span-2">
          <span className="text-sm font-medium text-slate-700">Details (optional)</span>
          <textarea
            className={`${inputClass} mt-1 h-20`}
            value={form.description}
            onChange={set('description')}
            placeholder="What the customer reported, error codes, when it started..."
          />
        </label>
      </div>
    </Modal>
  )
}
