import { useState } from 'react'
import { createTechnician, TECHNICIAN_SKILLS, TECHNICIAN_STATUSES, updateTechnician } from '../../../api/operations'
import { labelize } from '../utils'
import { Button, Field, inputClass, Modal } from './ui'

const EMPTY = { name: '', phone: '', email: '', skills: [], status: 'available' }

const validate = (f) => {
  const e = {}
  if (!f.name.trim()) e.name = 'Name is required'
  if (!/^[6-9]\d{9}$/.test(f.phone.trim())) e.phone = 'Enter a 10-digit mobile number'
  if (f.email.trim() && !/^\S+@\S+\.\S+$/.test(f.email.trim())) e.email = 'Enter a valid email'
  if (f.skills.length === 0) e.skills = 'Pick at least one skill'
  return e
}

// technician = null -> add mode. Parent mounts with a `key` so the form resets per technician.
export default function TechnicianFormModal({ open, technician, onClose, onSaved }) {
  const isEdit = Boolean(technician)
  const [form, setForm] = useState(() => (technician ? { ...EMPTY, ...technician } : EMPTY))
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [serverError, setServerError] = useState('')

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))
  const toggleSkill = (skill) =>
    setForm((f) => ({ ...f, skills: f.skills.includes(skill) ? f.skills.filter((s) => s !== skill) : [...f.skills, skill] }))

  const submit = async (e) => {
    e.preventDefault()
    const found = validate(form)
    setErrors(found)
    if (Object.keys(found).length) return
    const payload = {
      name: form.name.trim(),
      phone: form.phone.trim(),
      email: form.email.trim().toLowerCase(),
      skills: form.skills,
      status: form.status,
    }
    setSaving(true)
    setServerError('')
    try {
      const saved = isEdit ? await updateTechnician(technician._id, payload) : await createTechnician(payload)
      onSaved(saved, isEdit)
    } catch (err) {
      setServerError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={open}
      title={isEdit ? `Edit ${technician.name}` : 'Add technician'}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="technician-form" disabled={saving}>
            {saving ? 'Saving...' : isEdit ? 'Save changes' : 'Add technician'}
          </Button>
        </>
      }
    >
      <form id="technician-form" onSubmit={submit} className="grid grid-cols-1 gap-4 sm:grid-cols-2" noValidate>
        {serverError && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 sm:col-span-2">{serverError}</p>}
        <div className="sm:col-span-2">
          <Field label="Full name" error={errors.name}>
            <input className={inputClass} value={form.name} onChange={set('name')} placeholder="Harpreet Singh" />
          </Field>
        </div>
        <Field label="Mobile" error={errors.phone}>
          <input className={inputClass} value={form.phone} onChange={set('phone')} placeholder="9814000101" inputMode="numeric" maxLength={10} />
        </Field>
        <Field label="Email (optional)" error={errors.email}>
          <input className={inputClass} value={form.email} onChange={set('email')} placeholder="name@solarconnect.com" />
        </Field>
        <div className="sm:col-span-2">
          <Field label="Skills" error={errors.skills}>
            <div className="flex flex-wrap gap-2">
              {TECHNICIAN_SKILLS.map((skill) => {
                const on = form.skills.includes(skill)
                return (
                  <button
                    key={skill}
                    type="button"
                    onClick={() => toggleSkill(skill)}
                    className={`rounded-full border px-3 py-1 text-sm ${on ? 'border-amber-500 bg-amber-50 text-amber-900' : 'border-slate-300 text-slate-600 hover:bg-slate-50'}`}
                  >
                    {on ? '✓ ' : ''}
                    {labelize(skill)}
                  </button>
                )
              })}
            </div>
          </Field>
        </div>
        <Field label="Availability">
          <select className={inputClass} value={form.status} onChange={set('status')}>
            {TECHNICIAN_STATUSES.map((s) => (
              <option key={s} value={s}>
                {labelize(s)}
              </option>
            ))}
          </select>
        </Field>
      </form>
    </Modal>
  )
}
