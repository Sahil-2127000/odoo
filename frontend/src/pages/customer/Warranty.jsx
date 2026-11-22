// /customer/warranty - every item I bought with its warranty: active, expired,
// or "starts at installation" if the system is not installed yet.
import { useEffect, useState } from 'react'
import { Badge, DataTable, PageHeader, useToast } from '@/components/ui'
import { getPortalSummary } from '@/api/portal'
import { formatDate } from '@/utils/format'

export default function Warranty() {
  const toast = useToast()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getPortalSummary()
      .then(({ orders }) =>
        // one row per item of every order
        setRows(
          orders.flatMap((order) =>
            order.items.map((item) => ({
              _id: `${order._id}-${item._id}`,
              orderCode: order.code,
              product: item.product?.name ?? 'Product',
              qty: item.qty,
              years: item.product?.warrantyYears,
              warrantyEnd: item.warrantyEnd,
            })),
          ),
        ),
      )
      .catch((err) => toast.error(err.message))
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const columns = [
    { key: 'product', header: 'Item', className: 'font-medium text-slate-900' },
    { key: 'qty', header: 'Qty', align: 'right' },
    { key: 'orderCode', header: 'Order', className: 'font-mono text-xs' },
    { key: 'years', header: 'Warranty', render: (r) => (r.years ? `${r.years} years` : '—') },
    { key: 'warrantyEnd', header: 'Valid till', render: (r) => formatDate(r.warrantyEnd) },
    {
      key: 'status',
      header: 'Status',
      render: (r) =>
        !r.warrantyEnd ? (
          <Badge tone="gray">Starts at installation</Badge>
        ) : new Date(r.warrantyEnd) > new Date() ? (
          <Badge tone="green">Active</Badge>
        ) : (
          <Badge tone="red">Expired</Badge>
        ),
    },
  ]

  return (
    <>
      <PageHeader title="Warranty" subtitle="The warranty of each part starts on the day your system is installed" />
      <DataTable columns={columns} data={rows} loading={loading} emptyTitle="No items yet" pageSize={20} />
    </>
  )
}
