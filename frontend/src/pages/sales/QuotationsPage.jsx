// Quotations list: search/filter, send, accept (creates an order), reject, print, edit drafts.
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useToast } from '@/components/ui'
import PageShell from './PageShell'
import { Button, Table, Badge, Modal, Input, Select, Card } from './ui'
import { quotationsApi, isGlobalMockEnabled } from '@/api/sales'
import { formatCurrency, formatDate, listFrom, systemTypeLabel } from './salesHelpers'

const STATUS_OPTIONS = [
  { value: 'all', label: 'All statuses' },
  { value: 'draft', label: 'Draft' },
  { value: 'sent', label: 'Sent' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'rejected', label: 'Rejected' },
]

export default function QuotationsPage() {
  const navigate = useNavigate()
  const toast = useToast()
  // Real backend: quotes are open until accepted (no draft/sent/rejected, no editing).
  const live = !isGlobalMockEnabled()
  const [quotes, setQuotes] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [busyId, setBusyId] = useState(null)
  const [acceptTarget, setAcceptTarget] = useState(null)
  const [acceptedOrder, setAcceptedOrder] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    const res = await quotationsApi.getQuotations()
    setQuotes(listFrom(res))
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return quotes.filter(
      (item) =>
        (status === 'all' || item.status === status) &&
        (!q ||
          item.quotationNumber?.toLowerCase().includes(q) ||
          item.customerName?.toLowerCase().includes(q) ||
          item.customerCity?.toLowerCase().includes(q)),
    )
  }, [quotes, search, status])

  const counts = useMemo(() => {
    const by = (s) => quotes.filter((q) => q.status === s)
    const sum = (list) => list.reduce((acc, q) => acc + (q.grandTotal || 0), 0)
    const open = quotes.filter((q) => q.status === 'draft' || q.status === 'sent')
    return {
      draft: by('draft').length,
      sent: by('sent').length,
      accepted: by('accepted').length,
      openValue: sum(open),
      wonValue: sum(by('accepted')),
    }
  }, [quotes])

  const runAction = async (id, fn, okMsg) => {
    setBusyId(id)
    const res = await fn()
    setBusyId(null)
    if (res?.success === false) {
      toast.error(res.message || 'Action failed')
      return null
    }
    toast.success(res?.message || okMsg)
    await load()
    return res
  }

  const confirmAccept = async () => {
    const quote = acceptTarget
    setAcceptTarget(null)
    const res = await runAction(quote.id, () => quotationsApi.acceptQuotation(quote.id), 'Quotation accepted')
    if (res?.data?.order) setAcceptedOrder(res.data.order)
  }

  const columns = [
    {
      key: 'quotationNumber',
      title: 'Quotation',
      render: (v, row) => (
        <div>
          <div className="font-semibold text-slate-900">{v}</div>
          <div className="text-xs text-slate-400">{formatDate(row.createdAt)}</div>
        </div>
      ),
    },
    {
      key: 'customerName',
      title: 'Customer',
      render: (v, row) => (
        <div>
          <Link to={`/sales/customers/${row.customerId}`} className="font-medium text-slate-800 hover:text-amber-700" onClick={(e) => e.stopPropagation()}>
            {v}
          </Link>
          <div className="text-xs text-slate-400">{row.customerCity || '—'}</div>
        </div>
      ),
    },
    {
      key: 'systemCapacityKw',
      title: 'System',
      render: (v, row) => (
        <div className="flex items-center gap-2">
          <span className="font-semibold">{v} kW</span>
          <Badge statusKey={row.systemType} size="sm">{systemTypeLabel(row.systemType)}</Badge>
        </div>
      ),
    },
    { key: 'grandTotal', title: 'Grand total', align: 'right', render: (v) => <span className="font-semibold text-slate-900">{formatCurrency(v)}</span> },
    { key: 'status', title: 'Status', render: (v) => <Badge statusKey={v} size="sm">{v}</Badge> },
    {
      key: 'actions',
      title: 'Actions',
      align: 'right',
      render: (_, row) => {
        const busy = busyId === row.id
        const open = row.status === 'draft' || row.status === 'sent'
        return (
          <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
            {row.status === 'draft' && (
              <>
                <Button size="sm" variant="ghost" onClick={() => navigate(`/sales/quotations/${row.id}/edit`)}>Edit</Button>
                <Button size="sm" variant="outline" loading={busy} onClick={() => runAction(row.id, () => quotationsApi.sendQuotation(row.id), 'Marked as sent')}>
                  Mark sent
                </Button>
              </>
            )}
            {open && (
              <>
                <Button size="sm" variant="success" disabled={busy} onClick={() => setAcceptTarget(row)}>Accept</Button>
                {!live && <Button
                  size="sm"
                  variant="ghost"
                  className="text-rose-600"
                  disabled={busy}
                  onClick={() => runAction(row.id, () => quotationsApi.updateQuotation(row.id, { status: 'rejected' }), 'Quotation marked as rejected')}
                >
                  Reject
                </Button>}
              </>
            )}
            <Button size="sm" variant="secondary" onClick={() => navigate(`/sales/quotations/${row.id}/print`)}>Print</Button>
          </div>
        )
      },
    },
  ]

  return (
    <PageShell
      title="Quotations"
      subtitle="Build, send and close solar system proposals. Accepting a quote creates the order."
      breadcrumbs={[{ label: 'Quotations' }]}
      actions={<Button onClick={() => navigate('/sales/quotations/new')}>+ New quotation</Button>}
    >
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card bodyClassName="p-4">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Drafts</div>
          <div className="mt-1 text-2xl font-bold text-slate-900">{counts.draft}</div>
        </Card>
        <Card bodyClassName="p-4">
          <div className="text-xs font-semibold uppercase tracking-wider text-blue-600">Sent, awaiting reply</div>
          <div className="mt-1 text-2xl font-bold text-slate-900">{counts.sent}</div>
        </Card>
        <Card bodyClassName="p-4">
          <div className="text-xs font-semibold uppercase tracking-wider text-amber-600">Open pipeline value</div>
          <div className="mt-1 text-2xl font-bold text-slate-900">{formatCurrency(counts.openValue)}</div>
        </Card>
        <Card bodyClassName="p-4">
          <div className="text-xs font-semibold uppercase tracking-wider text-emerald-600">Won ({counts.accepted})</div>
          <div className="mt-1 text-2xl font-bold text-slate-900">{formatCurrency(counts.wonValue)}</div>
        </Card>
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <Input
          name="search"
          placeholder="Search by quote number, customer or city..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="sm:max-w-sm"
        />
        <Select name="status" value={status} onChange={(e) => setStatus(e.target.value)} options={STATUS_OPTIONS} className="sm:max-w-[200px]" />
      </div>

      <Table
        columns={columns}
        data={filtered}
        isLoading={loading}
        onRowClick={(row) => navigate(`/sales/quotations/${row.id}/print`)}
        emptyMessage="No quotations match your filters"
      />

      <Modal
        isOpen={!!acceptTarget}
        onClose={() => setAcceptTarget(null)}
        title="Accept quotation?"
        subtitle={acceptTarget ? `${acceptTarget.quotationNumber} · ${acceptTarget.customerName}` : ''}
        footer={
          <>
            <Button variant="outline" onClick={() => setAcceptTarget(null)}>Cancel</Button>
            <Button variant="success" onClick={confirmAccept}>Accept &amp; create order</Button>
          </>
        }
      >
        {acceptTarget && (
          <p className="text-sm text-slate-600">
            The customer has agreed to <strong>{formatCurrency(acceptTarget.grandTotal)}</strong> for a{' '}
            {acceptTarget.systemCapacityKw} kW {systemTypeLabel(acceptTarget.systemType)} system. A confirmed order will be
            created so the advance payment can be recorded and Operations can reserve stock.
          </p>
        )}
      </Modal>

      <Modal
        isOpen={!!acceptedOrder}
        onClose={() => setAcceptedOrder(null)}
        title="Order created"
        subtitle={acceptedOrder?.orderNumber}
        footer={
          <>
            <Button variant="outline" onClick={() => setAcceptedOrder(null)}>Stay here</Button>
            <Button onClick={() => navigate(`/sales/orders/${acceptedOrder.id}`)}>Open order &amp; record advance</Button>
          </>
        }
      >
        {acceptedOrder && (
          <p className="text-sm text-slate-600">
            Order <strong>{acceptedOrder.orderNumber}</strong> for {acceptedOrder.customerName} is confirmed with{' '}
            <strong>{formatCurrency(acceptedOrder.totalAmount)}</strong> due.
          </p>
        )}
      </Modal>
    </PageShell>
  )
}
