// /tech - delivered orders assigned to me, mark installed with a photo of the panel.
import { useEffect, useRef, useState } from 'react'
import { Camera } from 'lucide-react'
import { Badge, Button, Card, EmptyState, Loader, PageHeader, useToast } from '@/components/ui'
import { getDeliveredOrders, markInstalled } from '@/api/tech/orders'
import { useAuth } from '@/context/AuthContext'
import { formatDate } from '@/utils/format'
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

    setInstalling(targetOrderId)
    try {
      const photo = await readPhotoAsBase64(file)
      await markInstalled(targetOrderId, photo)
      toast.success('Marked installed')
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
