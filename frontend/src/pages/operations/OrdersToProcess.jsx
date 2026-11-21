// /operations/orders - confirmed orders waiting to be packed and dispatched.
// Dispatch asks for serial numbers typed in (not scanned) - one per line.
import { useEffect, useState } from 'react'
import { PackageCheck, Truck } from 'lucide-react'
import { Badge, Button, DataTable, Modal, PageHeader, Tabs, Textarea, useToast } from '@/components/ui'
import { advanceStatus, getOrders } from '@/api/operations/orders'
import { formatCurrency } from '@/utils/format'

const TABS = [
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'packed', label: 'Packed' },
  { value: 'dispatched', label: 'Dispatched' },
]

export default function OrdersToProcess() {
  const toast = useToast()
  const [tab, setTab] = useState('confirmed')
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [packing, setPacking] = useState(null) // order id being marked packed
  const [dispatchTarget, setDispatchTarget] = useState(null) // order being dispatched

  function load() {
    setLoading(true)
    getOrders(tab)
      .then(setRows)
      .catch((err) => toast.error(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(load, [tab]) // eslint-disable-line react-hooks/exhaustive-deps

  async function handlePack(id) {
    setPacking(id)
    try {
      await advanceStatus(id, 'packed')
      toast.success('Order marked packed')
      load()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setPacking(null)
    }
  }

  const columns = [
    { key: 'code', header: 'Order', className: 'font-mono text-xs' },
    { key: 'customer.name', header: 'Customer' },
    { key: 'customer.address', header: 'Address' },
    { key: 'total', header: 'Total', align: 'right', render: (o) => formatCurrency(o.total) },
    { key: 'status', header: 'Status', render: (o) => <Badge status={o.status} /> },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (o) =>
        o.status === 'confirmed' ? (
          <Button size="sm" icon={PackageCheck} loading={packing === o._id} onClick={() => handlePack(o._id)}>
            Mark packed
          </Button>
        ) : o.status === 'packed' ? (
          <Button size="sm" icon={Truck} onClick={() => setDispatchTarget(o)}>
            Dispatch
          </Button>
        ) : null,
    },
  ]

  return (
    <>
      <PageHeader title="Orders to process" subtitle="Pack and dispatch confirmed orders" />

      <Tabs value={tab} onChange={setTab} tabs={TABS} className="mb-4" />

      <DataTable columns={columns} data={rows} loading={loading} emptyTitle="Nothing here" />

      {dispatchTarget && (
        <DispatchModal
          order={dispatchTarget}
          onClose={() => setDispatchTarget(null)}
          onDone={() => {
            setDispatchTarget(null)
            load()
          }}
        />
      )}
    </>
  )
}

function DispatchModal({ order, onClose, onDone }) {
  const toast = useToast()
  const [text, setText] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    // one serial number per line (typed in, not scanned)
    const serials = text
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean)
    if (serials.length === 0) return

    setSaving(true)
    try {
      await advanceStatus(order._id, 'dispatched', serials)
      toast.success('Order dispatched')
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
      title={`Dispatch ${order.code}`}
      description="Type each serial number on its own line before the truck leaves"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="dispatch-form" loading={saving} disabled={!text.trim()}>
            Confirm dispatch
          </Button>
        </>
      }
    >
      <form id="dispatch-form" onSubmit={handleSubmit}>
        <Textarea
          label="Serial numbers"
          placeholder={'INV-00123\nBAT-00456\n...'}
          rows={6}
          value={text}
          onChange={(e) => setText(e.target.value)}
          autoFocus
        />
      </form>
    </Modal>
  )
}
