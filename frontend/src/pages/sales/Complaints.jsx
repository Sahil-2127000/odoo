// /sales/complaints - tickets raised by customers, assign a technician to each.
import { useEffect, useState } from 'react'
import { Badge, Button, PageHeader, Select, DataTable, useToast } from '@/components/ui'
import { assignTicket, getTechnicians, getTickets } from '@/api/sales/tickets'
import { formatCurrency, formatDate } from '@/utils/format'

export default function Complaints() {
  const toast = useToast()
  const [rows, setRows] = useState([])
  const [technicians, setTechnicians] = useState([])
  const [loading, setLoading] = useState(true)
  const [picked, setPicked] = useState({}) // ticketId -> technicianId chosen in the dropdown
  const [assigning, setAssigning] = useState(null) // ticketId currently being assigned

  function load() {
    setLoading(true)
    Promise.all([getTickets(), getTechnicians()])
      .then(([tickets, techs]) => {
        setRows(tickets)
        setTechnicians(techs)
      })
      .catch((err) => toast.error(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(load, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleAssign(ticketId) {
    const technicianId = picked[ticketId]
    if (!technicianId) return
    setAssigning(ticketId)
    try {
      await assignTicket(ticketId, technicianId)
      toast.success('Technician assigned')
      load()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setAssigning(null)
    }
  }

  const columns = [
    { key: 'code', header: 'Ticket', className: 'font-mono text-xs' },
    { key: 'customer.name', header: 'Customer' },
    { key: 'order.code', header: 'Order', className: 'font-mono text-xs' },
    { key: 'issue', header: 'Issue' },
    {
      key: 'underWarranty',
      header: 'Warranty',
      render: (t) => (t.underWarranty ? <Badge tone="green">Free repair</Badge> : <Badge tone="red">{formatCurrency(t.billAmount)}</Badge>),
    },
    { key: 'status', header: 'Status', render: (t) => <Badge status={t.status} /> },
    { key: 'createdAt', header: 'Raised', render: (t) => formatDate(t.createdAt) },
    {
      key: 'assign',
      header: '',
      align: 'right',
      render: (t) =>
        t.status === 'open' ? (
          <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
            <Select
              value={picked[t._id] || ''}
              onChange={(e) => setPicked((p) => ({ ...p, [t._id]: e.target.value }))}
              placeholder="Assign to..."
              options={technicians.map((u) => ({ value: u._id, label: u.name }))}
              className="w-40"
            />
            <Button size="sm" loading={assigning === t._id} disabled={!picked[t._id]} onClick={() => handleAssign(t._id)}>
              Assign
            </Button>
          </div>
        ) : (
          <span className="text-xs text-slate-500">{t.assignedTo?.name || '—'}</span>
        ),
    },
  ]

  return (
    <>
      <PageHeader title="Complaints" subtitle="Service tickets raised by customers" />
      <DataTable columns={columns} data={rows} loading={loading} emptyTitle="No complaints" />
    </>
  )
}
