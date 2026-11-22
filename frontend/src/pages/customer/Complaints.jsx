// /customer/complaints - report a problem on an installed system, follow the ticket,
// and confirm when the repair works. Free or billed is decided automatically by the warranty.
import { useEffect, useState } from 'react'
import { CheckCircle2, Send } from 'lucide-react'
import { Badge, Button, Card, DataTable, PageHeader, Select, Textarea, useToast } from '@/components/ui'
import { confirmFix, getPortalSummary, raiseComplaint } from '@/api/portal'
import { formatCurrency, formatDate } from '@/utils/format'

export default function Complaints() {
  const toast = useToast()
  const [orders, setOrders] = useState([])
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [orderId, setOrderId] = useState('')
  const [issue, setIssue] = useState('')
  const [sending, setSending] = useState(false)
  const [confirming, setConfirming] = useState(null)

  function load() {
    getPortalSummary()
      .then((data) => {
        const installed = data.orders.filter((o) => o.status === 'installed')
        setOrders(installed)
        setTickets(data.tickets)
        if (installed.length === 1) setOrderId(installed[0]._id) // only one system: pick it for them
      })
      .catch((err) => toast.error(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(load, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSubmit(e) {
    e.preventDefault()
    if (!orderId || !issue.trim()) return
    setSending(true)
    try {
      const ticket = await raiseComplaint(orderId, issue.trim())
      toast.success(
        `Ticket ${ticket.code} registered. ${ticket.underWarranty ? 'Under warranty, the repair is free.' : `Repair charge ${formatCurrency(ticket.billAmount)}.`}`,
      )
      setIssue('')
      load()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSending(false)
    }
  }

  async function handleConfirm(id) {
    setConfirming(id)
    try {
      await confirmFix(id)
      toast.success('Thanks! Your ticket is closed')
      load()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setConfirming(null)
    }
  }

  const columns = [
    { key: 'code', header: 'Ticket', className: 'font-mono text-xs' },
    { key: 'order.code', header: 'Order', className: 'font-mono text-xs' },
    { key: 'issue', header: 'Problem', className: 'whitespace-normal' },
    {
      key: 'billAmount',
      header: 'Charge',
      render: (t) => (t.underWarranty ? <Badge tone="green">Free (warranty)</Badge> : formatCurrency(t.billAmount)),
    },
    { key: 'assignedTo', header: 'Technician', render: (t) => t.assignedTo?.name ?? '—' },
    { key: 'status', header: 'Status', render: (t) => <Badge status={t.status} /> },
    { key: 'createdAt', header: 'Raised', render: (t) => formatDate(t.createdAt) },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (t) =>
        t.status === 'resolved' && (
          <Button size="sm" icon={CheckCircle2} loading={confirming === t._id} onClick={() => handleConfirm(t._id)}>
            Yes, it works now
          </Button>
        ),
    },
  ]

  return (
    <>
      <PageHeader title="Complaints" subtitle="Report a problem and follow the repair" />

      <Card title="Report a problem" className="mb-6">
        {orders.length === 0 ? (
          <p className="text-sm text-slate-500">You can report a problem once your system is installed.</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <Select
              label="System"
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              placeholder="Choose your order"
              options={orders.map((o) => ({ value: o._id, label: `${o.code} (installed ${formatDate(o.installedAt)})` }))}
            />
            <Textarea
              label="What is the problem?"
              rows={3}
              value={issue}
              onChange={(e) => setIssue(e.target.value)}
              placeholder="e.g. Inverter shows error E07 and there is no power since morning"
            />
            <Button type="submit" icon={Send} loading={sending} disabled={!orderId || !issue.trim()}>
              Submit complaint
            </Button>
          </form>
        )}
      </Card>

      <DataTable columns={columns} data={tickets} loading={loading} emptyTitle="No complaints" />
    </>
  )
}
