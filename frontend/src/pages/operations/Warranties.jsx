// /operations/warranties - read-only view of installed orders and their warranty status.
import { useEffect, useState } from 'react'
import { Badge, Card, Loader, PageHeader, useToast } from '@/components/ui'
import { getWarranties } from '@/api/operations/orders'
import { formatDate } from '@/utils/format'

export default function Warranties() {
  const toast = useToast()
  const [rows, setRows] = useState(null)

  useEffect(() => {
    getWarranties()
      .then(setRows)
      .catch((err) => toast.error(err.message))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <>
      <PageHeader title="Warranties" subtitle="Per-item warranty status, computed from each order's install date" />

      {rows === null ? (
        <Loader />
      ) : (
        <div className="space-y-4">
          {rows.map((order) => (
            <Card key={order.orderCode} title={order.orderCode} subtitle={`${order.customer.name} - installed ${formatDate(order.installedAt)}`}>
              <ul className="space-y-2">
                {order.items.map((item) => (
                  <li key={item.name} className="flex items-center justify-between text-sm">
                    <span className="text-slate-700">
                      {item.name} ({item.warrantyYears}y)
                    </span>
                    <span className="flex items-center gap-2">
                      <span className="text-slate-500">Ends {formatDate(item.warrantyEnd)}</span>
                      <Badge tone={item.status === 'active' ? 'green' : 'red'}>
                        {item.status === 'active' ? 'Active' : 'Expired'}
                      </Badge>
                    </span>
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      )}
    </>
  )
}
