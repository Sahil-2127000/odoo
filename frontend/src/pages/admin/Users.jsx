// /admin/users - staff accounts. Add new staff and switch accounts on or off.
import { useEffect, useState } from 'react'
import { Plus, UserCheck, UserX } from 'lucide-react'
import { Badge, Button, ConfirmDialog, DataTable, Input, Modal, PageHeader, Select, useToast } from '@/components/ui'
import { createStaff, getUsers, toggleUserStatus } from '@/api/admin'
import { ROLE_LABELS } from '@/constants/status'
import { useAuth } from '@/context/AuthContext'
import { formatDate } from '@/utils/format'

// Roles an admin can give to staff: [{ value: 'admin', label: 'Admin' }, ...]
const ROLE_OPTIONS = Object.entries(ROLE_LABELS).map(([value, label]) => ({ value, label }))
const ROLE_TONES = { admin: 'orange', customer_care: 'blue', warehouse: 'purple', technician: 'amber' }

export default function Users() {
  const toast = useToast()
  const { user: me } = useAuth() // the admin who is logged in
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [role, setRole] = useState('') // '' = all roles
  const [formOpen, setFormOpen] = useState(false)
  const [userToToggle, setUserToToggle] = useState(null)
  const [toggling, setToggling] = useState(false)

  function loadUsers() {
    getUsers()
      .then(setUsers)
      .catch((err) => toast.error(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(loadUsers, []) // eslint-disable-line react-hooks/exhaustive-deps

  const shown = role ? users.filter((u) => u.role === role) : users

  async function handleToggle() {
    setToggling(true)
    try {
      await toggleUserStatus(userToToggle._id)
      toast.success(`${userToToggle.name} ${userToToggle.isActive ? 'disabled' : 'enabled'}`)
      setUserToToggle(null)
      loadUsers()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setToggling(false)
    }
  }

  function handleCreated(name) {
    setFormOpen(false)
    toast.success(`${name} can now log in`)
    loadUsers()
  }

  const columns = [
    { key: 'name', header: 'Name', sortable: true, className: 'font-medium text-slate-900' },
    { key: 'email', header: 'Email' },
    { key: 'phone', header: 'Phone' },
    { key: 'role', header: 'Role', render: (u) => <Badge tone={ROLE_TONES[u.role]}>{ROLE_LABELS[u.role] ?? u.role}</Badge> },
    {
      key: 'isActive',
      header: 'Status',
      render: (u) => (u.isActive ? <Badge tone="green">Active</Badge> : <Badge tone="gray">Disabled</Badge>),
    },
    { key: 'createdAt', header: 'Added on', render: (u) => formatDate(u.createdAt) },
    {
      key: 'actions',
      header: '',
      align: 'right',
      // You cannot switch off your own account
      render: (u) =>
        u.email === me?.email ? (
          <span className="text-xs text-slate-400">You</span>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            icon={u.isActive ? UserX : UserCheck}
            onClick={() => setUserToToggle(u)}
          >
            {u.isActive ? 'Disable' : 'Enable'}
          </Button>
        ),
    },
  ]

  return (
    <>
      <PageHeader
        title="Users"
        subtitle="Staff who can log in to SolarConnect"
        actions={
          <Button icon={Plus} onClick={() => setFormOpen(true)}>
            Add staff
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={shown}
        loading={loading}
        searchable
        searchKeys={['name', 'email', 'phone']}
        searchPlaceholder="Search name, email or phone..."
        toolbar={
          <Select value={role} onChange={(e) => setRole(e.target.value)} options={ROLE_OPTIONS} placeholder="All roles" />
        }
        emptyTitle="No staff found"
      />

      {formOpen && <StaffForm onClose={() => setFormOpen(false)} onCreated={handleCreated} />}

      <ConfirmDialog
        open={Boolean(userToToggle)}
        title={userToToggle?.isActive ? 'Disable this account?' : 'Enable this account?'}
        message={
          userToToggle?.isActive
            ? `${userToToggle?.name} will not be able to log in until you enable them again.`
            : `${userToToggle?.name} will be able to log in again.`
        }
        confirmText={userToToggle?.isActive ? 'Disable' : 'Enable'}
        danger={userToToggle?.isActive}
        loading={toggling}
        onConfirm={handleToggle}
        onClose={() => setUserToToggle(null)}
      />
    </>
  )
}

const EMPTY_STAFF = { name: '', email: '', phone: '', role: 'customer_care', password: '' }

// Pop-up form to create a staff login
function StaffForm({ onClose, onCreated }) {
  const [form, setForm] = useState(EMPTY_STAFF)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)

  const change = (field) => (e) => setForm({ ...form, [field]: e.target.value })

  function validate() {
    const e = {}
    if (!form.name.trim()) e.name = 'Enter the full name'
    if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = 'Enter a valid email'
    if (form.phone && !/^\d{10}$/.test(form.phone)) e.phone = 'Phone must be 10 digits'
    if (form.password.length < 6) e.password = 'At least 6 characters'
    return e
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const e = validate()
    setErrors(e)
    if (Object.keys(e).length) return

    setSaving(true)
    try {
      await createStaff({ ...form, name: form.name.trim(), email: form.email.trim() })
      onCreated(form.name.trim())
    } catch (err) {
      setErrors({ form: err.message })
      setSaving(false)
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Add staff"
      description="They log in with this email and password."
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="staff-form" loading={saving}>
            Create account
          </Button>
        </>
      }
    >
      <form id="staff-form" onSubmit={handleSubmit} className="space-y-4" noValidate>
        {errors.form && <p className="rounded-lg bg-danger-50 px-3 py-2 text-sm text-danger-700">{errors.form}</p>}
        <Input label="Full name" required value={form.name} onChange={change('name')} error={errors.name} />
        <Input label="Email" type="email" required value={form.email} onChange={change('email')} error={errors.email} />
        <Input
          label="Phone"
          inputMode="numeric"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
          error={errors.phone}
        />
        <Select label="Role" value={form.role} onChange={change('role')} options={ROLE_OPTIONS} />
        <Input
          label="Password"
          type="password"
          required
          value={form.password}
          onChange={change('password')}
          error={errors.password}
          hint="At least 6 characters. Share it with them privately."
          autoComplete="new-password"
        />
      </form>
    </Modal>
  )
}
