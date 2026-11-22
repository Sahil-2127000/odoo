// /tech - delivered orders assigned to me. Mark installed with a photo of the panel,
// and collect the remaining balance from the customer at the same time.
import { useEffect, useRef, useState } from 'react'
import { Camera } from 'lucide-react'
import { Badge, Button, Card, EmptyState, Input, Loader, PageHeader, useToast } from '@/components/ui'
import { getDeliveredOrders, markInstalled } from '@/api/tech/orders'
import { useAuth } from '@/context/AuthContext'
import { formatCurrency, formatDate } from '@/utils/format'
import TechTabs from './TechTabs'

// Reads a selected photo file and resolves to a base64 data URI, e.g. "data:image/jpeg;base64,..."
function readPhotoAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export default function MyInstallations() {
  const toast = useToast()
  const { user } = useAuth()
  const [orders, setOrders] = useState(null)
  const [installing, setInstalling] = useState(null) // order _id currently uploading
  const fileInputRef = useRef(null)
  const [targetOrderId, setTargetOrderId] = useState(null)
  const [collected, setCollected] = useState({}) // orderId -> amount typed by the technician

  const balanceOf = (order) => order.total - order.amountPaid
  // until the technician types something, assume they collect the full balance
  const collectedFor = (order) => collected[order._id] ?? String(balanceOf(order))

  function load() {
    getDeliveredOrders()
      .then((all) => setOrders(all.filter((o) => o.assignedTechnician?._id === user._id)))
      .catch((err) => toast.error(err.message))
  }

  useEffect(load, []) // eslint-disable-line react-hooks/exhaustive-deps

  function openPhotoPicker(orderId) {
    setTargetOrderId(orderId)
    fileInputRef.current?.click()
  }

  async function handleFileChange(e) {
    const file = e.target.files?.[0]
    e.target.value = '' // allow picking the same file again later
    if (!file || !targetOrderId) return

    const order = orders.find((o) => o._id === targetOrderId)
    const amount = Number(collectedFor(order)) || 0

    setInstalling(targetOrderId)
    try {
      const photo = await readPhotoAsBase64(file)
      // cash / UPI taken on site; an online payment gateway could be plugged in here later
      await markInstalled(targetOrderId, photo, amount)
      toast.success(amount > 0 ? `Marked installed, ${formatCurrency(amount)} collected` : 'Marked installed')
      load()
    } catch (err) {
      toast.error(err.message || 'Could not upload photo')
    } finally {
      setInstalling(null)
      setTargetOrderId(null)
    }
  }

  return (
    <>
      <PageHeader title="My installations" />
      <TechTabs />

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileChange}
      />

      {orders === null ? (
        <Loader />
      ) : orders.length === 0 ? (
        <EmptyState title="No jobs waiting" description="Delivered orders assigned to you will show up here" />
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <Card key={order._id} padding={false}>
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <p className="font-mono text-sm font-semibold text-slate-900">{order.code}</p>
                  <Badge status={order.status} />
                </div>
                <p className="mt-1 text-sm text-slate-700">{order.customer.name}</p>
                <p className="text-xs text-slate-500">{order.customer.phone} · {order.customer.address}</p>
                {order.scheduledDate && (
                  <p className="mt-1 text-xs text-slate-500">Scheduled: {formatDate(order.scheduledDate)}</p>
                )}

                {/* Remaining payment, collected when the job is done */}
                <div className="mt-3 rounded-lg bg-slate-50 p-3">
                  {balanceOf(order) > 0 ? (
                    <>
                      <p className="text-sm text-slate-700">
                        Balance to collect: <strong className="text-slate-900">{formatCurrency(balanceOf(order))}</strong>
                      </p>
                      <Input
                        label="Amount collected now (₹)"
                        type="number"
                        inputMode="numeric"
                        className="mt-2"
                        value={collectedFor(order)}
                        onChange={(e) => setCollected({ ...collected, [order._id]: e.target.value })}
                        hint="Cash or UPI from the customer. Enter 0 if they will pay later."
                      />
                    </>
                  ) : (
                    <p className="text-sm font-medium text-success-700">Fully paid, nothing to collect</p>
                  )}
                </div>

                <Button
                  icon={Camera}
                  size="sm"
                  fullWidth
                  className="mt-3"
                  loading={installing === order._id}
                  onClick={() => openPhotoPicker(order._id)}
                >
                  Mark installed (photo)
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  )
}
