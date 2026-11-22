// /sales/orders - create a quote from a kit, confirm it, and record payments.
import { useEffect, useState } from 'react'
import { CheckCircle2, Plus } from 'lucide-react'
import { Badge, Button, DataTable, Input, Modal, PageHeader, Select, Tabs, useToast } from '@/components/ui'
import { addPayment, confirmOrder, createOrder, getKits, getOrder, getOrders } from '@/api/sales/orders'
import { getCustomers } from '@/api/sales/customers'
import { ORDER_STATUSES, statusLabel } from '@/constants/status'
import { formatCurrency, formatDate } from '@/utils/format'

const TABS = ORDER_STATUSES.map((value) => ({ value, label: statusLabel(value) }))

const SYSTEM_TYPES = [
  { value: 'on_grid', label: 'On-Grid (connected to the grid)' },
  { value: 'off_grid', label: 'Off-Grid (with battery backup)' },
]

// { capacityKw: 3, systemType: 'off_grid' } -> "3 kW Off-Grid"
const systemText = (o) =>
  o.systemType ? `${o.capacityKw ?? '?'} kW ${o.systemType === 'off_grid' ? 'Off-Grid' : 'On-Grid'}` : '—'

export default function Orders() {
  const toast = useToast()
  const [tab, setTab] = useState('quoted')
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [openId, setOpenId] = useState(null)
  const [newQuoteOpen, setNewQuoteOpen] = useState(false)

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
    { key: 'customer.name', header: 'Customer', sortable: true },
    { key: 'customer.phone', header: 'Phone' },
    { key: 'systemType', header: 'System', render: systemText },
    { key: 'total', header: 'Total', align: 'right', render: (o) => formatCurrency(o.total) },
    {
      key: 'pending',
      header: 'Pending',
      align: 'right',
      render: (o) => formatCurrency(o.total - o.amountPaid),
    },
    { key: 'status', header: 'Status', render: (o) => <Badge status={o.status} /> },
  ]

  return (
    <>
      <PageHeader
        title="Orders"
        subtitle="Quotes made from a kit, confirmed and paid"
        actions={
          <Button icon={Plus} onClick={() => setNewQuoteOpen(true)}>
            New quote
          </Button>
        }
      />

      <Tabs value={tab} onChange={setTab} tabs={TABS} className="mb-4" />

      <DataTable
        columns={columns}
        data={rows}
        loading={loading}
        onRowClick={(o) => setOpenId(o._id)}
        searchable
        searchKeys={['code', 'customer.name', 'customer.phone']}
        emptyTitle="No orders here"
      />

      {newQuoteOpen && (
        <NewQuoteModal
          onClose={() => setNewQuoteOpen(false)}
          onCreated={() => {
            setNewQuoteOpen(false)
            setTab('quoted')
            load()
          }}
        />
      )}

      {openId && (
        <OrderModal
          id={openId}
          onClose={() => setOpenId(null)}
          onChanged={() => {
            setOpenId(null)
            load()
          }}
        />
      )}
    </>
  )
}

function NewQuoteModal({ onClose, onCreated }) {
  const toast = useToast()
  const [customers, setCustomers] = useState([])
  const [kits, setKits] = useState([])
  const [customer, setCustomer] = useState('')
  const [systemType, setSystemType] = useState('on_grid')
  const [kit, setKit] = useState('')
  const [saving, setSaving] = useState(false)

  // only offer kits of the chosen type, smallest first
  const matchingKits = kits
    .filter((k) => (k.systemType || 'on_grid') === systemType)
    .sort((a, b) => (a.capacityKw ?? 0) - (b.capacityKw ?? 0))

  useEffect(() => {
    Promise.all([getCustomers(), getKits()])
      .then(([c, k]) => {
        setCustomers(c)
        setKits(k)
      })
      .catch((err) => toast.error(err.message))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!customer || !kit) return
    setSaving(true)
    try {
      await createOrder({ customer, kit })
      toast.success('Quote created')
      onCreated()
    } catch (err) {
      toast.error(err.message)
      setSaving(false)
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="New quote"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="new-quote-form" loading={saving} disabled={!customer || !kit}>
            Create quote
          </Button>
        </>
      }
    >
      <form id="new-quote-form" onSubmit={handleSubmit} className="space-y-4">
        <Select
          label="Customer"
          value={customer}
          onChange={(e) => setCustomer(e.target.value)}
          placeholder="Pick a customer"
          options={customers.map((c) => ({ value: c._id, label: `${c.name} (${c.phone})` }))}
        />
        <Select
          label="System type"
          value={systemType}
          onChange={(e) => {
            setSystemType(e.target.value)
            setKit('') // the picked kit may not match the new type
          }}
          options={SYSTEM_TYPES}
        />
        <Select
          label="Kit"
          value={kit}
          onChange={(e) => setKit(e.target.value)}
          placeholder="Pick a kit"
          options={matchingKits.map((k) => ({ value: k._id, label: `${k.name} - ${formatCurrency(k.price)}` }))}
        />
      </form>
    </Modal>
  )
}

function OrderModal({ id, onClose, onChanged }) {
  const toast = useToast()
  const [order, setOrder] = useState(null)
  const [confirming, setConfirming] = useState(false)
  const [amount, setAmount] = useState('')
  const [paying, setPaying] = useState(false)

  useEffect(() => {
    getOrder(id)
      .then(setOrder)
      .catch((err) => toast.error(err.message))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  async function handleConfirm() {
    setConfirming(true)
    try {
      await confirmOrder(id)
      toast.success('Order confirmed')
      onChanged()
    } catch (err) {
      toast.error(err.message)
      setConfirming(false)
    }
  }

  async function handlePay(e) {
    e.preventDefault()
    const n = Number(amount)
    if (!n || n <= 0) return
    setPaying(true)
    try {
      await addPayment(id, n)
      toast.success('Payment recorded')
      onChanged()
    } catch (err) {
      toast.error(err.message)
      setPaying(false)
    }
  }

  if (!order) {
    return (
      <Modal open onClose={onClose} title="Loading...">
        <p className="text-sm text-slate-500">Loading...</p>
      </Modal>
    )
  }

  const pending = order.total - order.amountPaid

  return (
    <Modal
      open
      onClose={onClose}
      title={order.code}
      description={`${order.customer.name} · ${systemText(order)}`}
      size="lg"
    >
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <Badge status={order.status} />
          {order.status === 'quoted' && (
            <Button icon={CheckCircle2} size="sm" loading={confirming} onClick={handleConfirm}>
              Confirm order
            </Button>
          )}
        </div>

        <div className="grid grid-cols-3 gap-3 text-sm">
          <div>
            <p className="text-slate-500">Total</p>
            <p className="font-semibold text-slate-900">{formatCurrency(order.total)}</p>
          </div>
          <div>
            <p className="text-slate-500">Paid</p>
            <p className="font-semibold text-slate-900">{formatCurrency(order.amountPaid)}</p>
          </div>
          <div>
            <p className="text-slate-500">Pending</p>
            <p className="font-semibold text-slate-900">{formatCurrency(pending)}</p>
          </div>
        </div>

        <div>
          <p className="mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">Items</p>
          <ul className="space-y-1 text-sm text-slate-700">
            {order.items.map((item) => (
              <li key={item._id} className="flex justify-between">
                <span>
                  {item.product.name} x {item.qty}
                </span>
                <span>{formatCurrency(item.price * item.qty)}</span>
              </li>
            ))}
          </ul>
        </div>

        {pending > 0 && (
          <form onSubmit={handlePay} className="flex items-end gap-3 border-t border-slate-100 pt-4">
            <Input
              label="Record a payment"
              type="number"
              placeholder={`Up to ${formatCurrency(pending)}`}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" loading={paying} disabled={!amount}>
              Add payment
            </Button>
          </form>
        )}

        <p className="text-xs text-slate-400">Created {formatDate(order.createdAt)}</p>
      </div>
    </Modal>
  )
}
