// Order detail: summary, linked quotation lines, payment receipts, record payment.
import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import PageShell from './PageShell'
import { Button, Card, Badge, Table } from './ui'
import RecordPaymentModal from './RecordPaymentModal'
import { PaymentProgress } from './OrdersPage'
import { ordersApi, quotationsApi } from '@/api/sales'
import { formatCurrency, formatDate, modeLabel, systemTypeLabel } from './salesHelpers'

const STEPS = ['confirmed', 'inventory_reserved', 'installation_scheduled', 'completed']
const STEP_LABELS = {
  confirmed: 'Order confirmed',
  inventory_reserved: 'Inventory reserved',
  installation_scheduled: 'Installation scheduled',
  completed: 'Installed & commissioned',
}

export default function OrderDetailPage() {
  const { id } = useParams()
  const [order, setOrder] = useState(null)
  const [quote, setQuote] = useState(null)
  const [loading, setLoading] = useState(true)
  const [payOpen, setPayOpen] = useState(false)

  const load = useCallback(async () => {
    const res = await ordersApi.getOrderById(id)
    const o = res?.data || null
    setOrder(o)
    if (o?.quotationId) {
      const q = await quotationsApi.getQuotationById(o.quotationId)
      setQuote(q?.data || null)
    }
    setLoading(false)
  }, [id])

  useEffect(() => {
    load()
  }, [load])

  const crumbs = [{ label: 'Orders', path: '/sales/orders' }]

  if (loading) {
    return <PageShell title="Order" breadcrumbs={[...crumbs, { label: 'Loading…' }]}><Card><p className="text-sm text-slate-500">Loading…</p></Card></PageShell>
  }
  if (!order) {
    return (
      <PageShell title="Order not found" breadcrumbs={[...crumbs, { label: 'Not found' }]}>
        <Card><Link to="/sales/orders" className="text-sm font-semibold text-amber-700">Back to orders</Link></Card>
      </PageShell>
    )
  }

  const stepIndex = STEPS.indexOf(order.status)
  const payments = order.payments || []

  const paymentColumns = [
    { key: 'date', title: 'Date', render: (v) => formatDate(v) },
    { key: 'amount', title: 'Amount', align: 'right', render: (v) => <span className="font-semibold text-emerald-700">{formatCurrency(v)}</span> },
    { key: 'mode', title: 'Mode', render: (v) => modeLabel(v) },
    { key: 'reference', title: 'Reference', render: (v) => <span className="font-mono text-xs">{v || '—'}</span> },
    { key: 'notes', title: 'Notes', render: (v) => <span className="text-xs text-slate-500">{v || '—'}</span> },
  ]

  return (
    <PageShell
      title={order.orderNumber}
      subtitle={`${order.customerName} · ${order.systemCapacityKw} kW ${systemTypeLabel(order.systemType)}`}
      breadcrumbs={[...crumbs, { label: order.orderNumber }]}
      actions={
        <>
          {order.quotationId && (
            <Link to={`/sales/quotations/${order.quotationId}/print`}><Button variant="outline">View quotation</Button></Link>
          )}
          {order.balanceAmount > 0 && <Button variant="success" onClick={() => setPayOpen(true)}>Record payment</Button>}
        </>
      }
    >
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card bodyClassName="p-4">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Order value</div>
          <div className="mt-1 text-2xl font-bold text-slate-900">{formatCurrency(order.totalAmount)}</div>
        </Card>
        <Card bodyClassName="p-4">
          <div className="text-xs font-semibold uppercase tracking-wider text-emerald-600">Paid</div>
          <div className="mt-1 text-2xl font-bold text-slate-900">{formatCurrency(order.paidAmount)}</div>
          <div className="mt-2"><PaymentProgress order={order} /></div>
        </Card>
        <Card bodyClassName="p-4">
          <div className="text-xs font-semibold uppercase tracking-wider text-rose-600">Balance due</div>
          <div className="mt-1 text-2xl font-bold text-slate-900">{formatCurrency(order.balanceAmount)}</div>
          <div className="mt-2"><Badge statusKey={order.paymentStatus} size="sm">{order.paymentStatus}</Badge></div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <Card title="Payment receipts" subtitle={`${payments.length} receipt${payments.length === 1 ? '' : 's'}`} bodyClassName="p-0">
            <Table columns={paymentColumns} data={payments} className="rounded-none border-0" emptyMessage="No payments recorded yet" />
          </Card>

          {quote && (
            <Card title={`Bill of materials · ${quote.quotationNumber}`} bodyClassName="p-0">
              <Table
                className="rounded-none border-0"
                keyField="productId"
                columns={[
                  { key: 'productName', title: 'Item', className: 'whitespace-normal' },
                  { key: 'qty', title: 'Qty', align: 'right' },
                  { key: 'unitPrice', title: 'Unit price', align: 'right', render: (v) => formatCurrency(v) },
                  { key: 'total', title: 'Amount', align: 'right', render: (v, r) => formatCurrency(v ?? r.qty * r.unitPrice) },
                ]}
                data={quote.lines || []}
              />
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card title="Fulfilment progress" subtitle="Updated by Operations as the order moves forward.">
            {order.status === 'cancelled' ? (
              <Badge statusKey="cancelled">Cancelled</Badge>
            ) : (
              <ol className="space-y-3">
                {STEPS.map((step, i) => {
                  const done = i <= stepIndex
                  return (
                    <li key={step} className="flex items-center gap-3 text-sm">
                      <span
                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                          done ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'
                        }`}
                      >
                        {done ? '✓' : i + 1}
                      </span>
                      <span className={done ? 'font-semibold text-slate-900' : 'text-slate-400'}>{STEP_LABELS[step]}</span>
                    </li>
                  )
                })}
              </ol>
            )}
          </Card>

          <Card title="Customer">
            <div className="text-sm">
              <Link to={`/sales/customers/${order.customerId}`} className="font-semibold text-amber-700 hover:underline">{order.customerName}</Link>
              <div className="text-slate-500">{order.customerPhone || '—'}</div>
              <div className="text-slate-500">{order.customerCity || '—'}</div>
              <div className="mt-3 text-xs text-slate-400">Order placed {formatDate(order.createdAt)}</div>
            </div>
          </Card>
        </div>
      </div>

      <RecordPaymentModal isOpen={payOpen} order={order} onClose={() => setPayOpen(false)} onRecorded={load} />
    </PageShell>
  )
}
