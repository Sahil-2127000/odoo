// /tech/complaints - tickets assigned to me. Tap one to open it, then mark it resolved.
import { useEffect, useState } from 'react'
import { CheckCircle2, ChevronRight } from 'lucide-react'
import { Badge, Button, Card, EmptyState, Loader, Modal, PageHeader, useToast } from '@/components/ui'
import { getMyTickets, resolveTicket } from '@/api/tech/tickets'
import { formatCurrency, formatDate } from '@/utils/format'
import TechTabs from './TechTabs'

export default function MyComplaints() {
  const toast = useToast()
  const [tickets, setTickets] = useState(null)
  const [selected, setSelected] = useState(null) // ticket opened in the popup
  const [resolving, setResolving] = useState(false)

  function load() {
    getMyTickets()
      .then(setTickets)
      .catch((err) => toast.error(err.message))
  }

  useEffect(load, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleResolve() {
    setResolving(true)
    try {
      await resolveTicket(selected._id)
      toast.success('Marked resolved')
      setSelected(null)
      load()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setResolving(false)
    }
  }

  return (
    <>
      <PageHeader title="My complaints" />
      <TechTabs />

      {tickets === null ? (
        <Loader />
      ) : tickets.length === 0 ? (
        <EmptyState title="No complaints assigned" />
      ) : (
        <div className="space-y-3">
          {tickets.map((t) => (
            <Card key={t._id} padding={false}>
              <button
                type="button"
                onClick={() => setSelected(t)}
                className="flex w-full cursor-pointer items-center gap-3 p-4 text-left hover:bg-slate-50"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <p className="font-mono text-sm font-semibold text-slate-900">{t.code}</p>
                    <Badge status={t.status} />
                  </div>
                  <p className="mt-1 text-sm text-slate-700">{t.customer.name}</p>
                  <p className="truncate text-sm text-slate-500">{t.issue}</p>
                </div>
                <ChevronRight className="h-5 w-5 shrink-0 text-slate-400" />
              </button>
            </Card>
          ))}
        </div>
      )}

      {selected && (
        <Modal
          open
          onClose={() => setSelected(null)}
          title={`Complaint ${selected.code}`}
          description={`Raised on ${formatDate(selected.createdAt)}`}
          footer={
            selected.status === 'assigned' ? (
              <Button icon={CheckCircle2} fullWidth loading={resolving} onClick={handleResolve}>
                Mark resolved
              </Button>
            ) : (
              <Button variant="secondary" fullWidth onClick={() => setSelected(null)}>
                Close
              </Button>
            )
          }
        >
          <dl className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <dt className="text-slate-500">Status</dt>
              <dd><Badge status={selected.status} /></dd>
            </div>
            <div>
              <dt className="text-slate-500">Customer</dt>
              <dd className="font-medium text-slate-900">{selected.customer.name}</dd>
              <dd className="text-slate-700">{selected.customer.phone}</dd>
              <dd className="text-slate-700">{selected.customer.address}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Order</dt>
              <dd className="font-mono text-slate-900">{selected.order?.code}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Issue</dt>
              <dd className="text-slate-900">{selected.issue}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Charge</dt>
              <dd>
                {selected.underWarranty ? (
                  <span className="font-medium text-success-700">Free repair (under warranty)</span>
                ) : (
                  <span className="font-medium text-danger-700">Billable: {formatCurrency(selected.billAmount)}</span>
                )}
              </dd>
            </div>
          </dl>
          {selected.status !== 'assigned' && (
            <p className="mt-4 rounded-md bg-slate-50 p-3 text-xs text-slate-500">
              This complaint is already {selected.status}. No action needed.
            </p>
          )}
        </Modal>
      )}
    </>
  )
}
