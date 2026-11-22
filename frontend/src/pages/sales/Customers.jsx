// /sales/customer-history - search customers, see their order history.
import { useEffect, useState } from 'react'
import { Badge, DataTable, Modal, PageHeader, useToast } from '@/components/ui'
import { getCustomer, getCustomerList as getCustomers } from '@/api/sales/customers'
import { formatCurrency, formatDate } from '@/utils/format'

export default function Customers() {
  const toast = useToast()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [openId, setOpenId] = useState(null)

  useEffect(() => {
    getCustomers()
      .then(setRows)
      .catch((err) => toast.error(err.message))
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const columns = [
    { key: 'code', header: 'Code', className: 'font-mono text-xs' },
    { key: 'name', header: 'Name', sortable: true },
    { key: 'phone', header: 'Phone' },
    { key: 'address', header: 'Address' },
  ]

  return (
    <>
      <PageHeader title="Customers" subtitle="Converted from enquiries" />

      <DataTable
        columns={columns}
        data={rows}
        loading={loading}
        onRowClick={(c) => setOpenId(c._id)}
        searchable
        searchKeys={['code', 'name', 'phone']}
        searchPlaceholder="Search name or phone..."
        emptyTitle="No customers yet"
      />

      {openId && <CustomerModal id={openId} onClose={() => setOpenId(null)} />}
    </>
  )
}

function CustomerModal({ id, onClose }) {
  const toast = useToast()
  const [data, setData] = useState(null)

  useEffect(() => {
    getCustomer(id)
      .then(setData)
      .catch((err) => toast.error(err.message))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const orderColumns = [
    { key: 'code', header: 'Order', className: 'font-mono text-xs' },
    { key: 'total', header: 'Total', align: 'right', render: (o) => formatCurrency(o.total) },
    { key: 'amountPaid', header: 'Paid', align: 'right', render: (o) => formatCurrency(o.amountPaid) },
    { key: 'status', header: 'Status', render: (o) => <Badge status={o.status} /> },
    { key: 'createdAt', header: 'Created', render: (o) => formatDate(o.createdAt) },
  ]

  return (
    <Modal
      open
      onClose={onClose}
      title={data?.customer?.name || 'Loading...'}
      description={data ? `${data.customer.code} · ${data.customer.phone}` : ''}
      size="lg"
    >
      {data ? (
        <div className="space-y-4">
          <p className="text-sm text-slate-600">{data.customer.address || 'No address on file'}</p>
          <DataTable columns={orderColumns} data={data.orders} pageSize={5} emptyTitle="No orders yet" />
        </div>
      ) : (
        <p className="text-sm text-slate-500">Loading...</p>
      )}
    </Modal>
  )
}
