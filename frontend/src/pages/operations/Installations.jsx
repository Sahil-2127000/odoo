// /operations/installations - schedule a technician for delivered orders, see installed ones.
import { useEffect, useState } from 'react'
import { CalendarClock } from 'lucide-react'
import { Badge, Button, DataTable, Input, Modal, PageHeader, Select, Tabs, useToast } from '@/components/ui'
import { getOrders, getTechnicians, scheduleInstallation } from '@/api/operations/orders'
import { formatDate } from '@/utils/format'

const TABS = [
  { value: 'delivered', label: 'To schedule' },
  { value: 'installed', label: 'Installed' },
]

export default function Installations() {
  const toast = useToast()
  const [tab, setTab] = useState('delivered')
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [target, setTarget] = useState(null)

  function load() {
    setLoading(true)
    getOrders(tab)
      .then(setRows)
      .catch((err) => toast.error(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(load, [tab]) // eslint-disable-line react-hooks/exhaustive-deps

  const columns = [
    { key: 'code', header: 'Order', className: 'font-mono text-xs' },
    { key: 'customer.name', header: 'Customer' },
    { key: 'customer.address', header: 'Address' },
    { key: 'status', header: 'Status', render: (o) => <Badge status={o.status} /> },
    {
      key: 'schedule',
      header: 'Scheduled',
      render: (o) =>
        o.scheduledDate ? (
          <span>
            {formatDate(o.scheduledDate)} - {o.assignedTechnician?.name || 'Unassigned'}
          </span>
        ) : (
          <span className="text-slate-400">-</span>
        ),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (o) =>
        o.status === 'delivered' ? (
          <Button size="sm" icon={CalendarClock} onClick={() => setTarget(o)}>
            Schedule
          </Button>
        ) : null,
    },
  ]

  return (
    <>
      <PageHeader title="Installations" subtitle="Schedule the crew for delivered orders" />

      <Tabs value={tab} onChange={setTab} tabs={TABS} className="mb-4" />

      <DataTable columns={columns} data={rows} loading={loading} emptyTitle="Nothing here" />

      {target && (
        <ScheduleModal
          order={target}
          onClose={() => setTarget(null)}
          onDone={() => {
            setTarget(null)
            load()
          }}
        />
      )}
    </>
  )
}

function ScheduleModal({ order, onClose, onDone }) {
  const toast = useToast()
  const [technicians, setTechnicians] = useState([])
  const [scheduledDate, setScheduledDate] = useState('')
  const [assignedTechnician, setAssignedTechnician] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    getTechnicians()
      .then(setTechnicians)
      .catch((err) => toast.error(err.message))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    try {
      await scheduleInstallation(order._id, { scheduledDate, assignedTechnician })
      toast.success('Installation scheduled')
      onDone()
    } catch (err) {
      toast.error(err.message)
      setSaving(false)
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={`Schedule - ${order.code}`}
      description={order.customer.name}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="schedule-form" loading={saving} disabled={!scheduledDate || !assignedTechnician}>
            Save
          </Button>
        </>
      }
    >
      <form id="schedule-form" onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Scheduled date"
          type="date"
          value={scheduledDate}
          onChange={(e) => setScheduledDate(e.target.value)}
        />
        <Select
          label="Technician"
          value={assignedTechnician}
          onChange={(e) => setAssignedTechnician(e.target.value)}
          placeholder="Pick a technician"
          options={technicians.map((t) => ({ value: t._id, label: t.name }))}
        />
      </form>
    </Modal>
  )
}
