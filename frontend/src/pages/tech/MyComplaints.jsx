// /tech/complaints - tickets assigned to me, mark resolved.
import { useEffect, useState } from 'react'
import { CheckCircle2 } from 'lucide-react'
import { Badge, Button, Card, EmptyState, Loader, PageHeader, useToast } from '@/components/ui'
import { getMyTickets, resolveTicket } from '@/api/tech/tickets'
import { formatCurrency } from '@/utils/format'
import TechTabs from './TechTabs'

export default function MyComplaints() {
  const toast = useToast()
  const [tickets, setTickets] = useState(null)
  const [resolving, setResolving] = useState(null)

  function load() {
    getMyTickets()
      .then(setTickets)
      .catch((err) => toast.error(err.message))
  }

  useEffect(load, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleResolve(id) {
    setResolving(id)
    try {
      await resolveTicket(id)
      toast.success('Marked resolved')
      load()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setResolving(null)
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
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <p className="font-mono text-sm font-semibold text-slate-900">{t.code}</p>
                  <Badge status={t.status} />
                </div>
                <p className="mt-1 text-sm text-slate-700">{t.customer.name}</p>
                <p className="text-xs text-slate-500">{t.customer.address}</p>
                <p className="mt-2 text-sm text-slate-700">{t.issue}</p>
                <p className="mt-1 text-xs">
                  {t.underWarranty ? (
                    <span className="font-medium text-success-700">Free repair (under warranty)</span>
                  ) : (
                    <span className="font-medium text-danger-700">Billable: {formatCurrency(t.billAmount)}</span>
                  )}
                </p>
                {t.status === 'assigned' && (
                  <Button
                    icon={CheckCircle2}
                    size="sm"
                    fullWidth
                    className="mt-3"
                    loading={resolving === t._id}
                    onClick={() => handleResolve(t._id)}
                  >
                    Mark resolved
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  )
}
