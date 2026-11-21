// /sales/follow-ups - enquiries with a follow-up call due today or earlier.
import { useEffect, useState } from 'react'
import { Badge, DataTable, PageHeader, useToast } from '@/components/ui'
import { getFollowUps } from '@/api/sales/enquiries'
import { formatDate } from '@/utils/format'

export default function FollowUps() {
  const toast = useToast()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getFollowUps()
      .then(setRows)
      .catch((err) => toast.error(err.message))
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const columns = [
    { key: 'code', header: 'Code', className: 'font-mono text-xs' },
    { key: 'name', header: 'Name', sortable: true },
    { key: 'phone', header: 'Phone' },
    { key: 'city', header: 'City' },
    { key: 'note', header: 'Last note' },
    { key: 'nextFollowUp', header: 'Due', render: (r) => formatDate(r.nextFollowUp) },
    { key: 'status', header: 'Status', render: (r) => <Badge status={r.status} /> },
  ]

  return (
    <>
      <PageHeader title="Today's follow-ups" subtitle="Calls due today or earlier - see Enquiries to update them" />
      <DataTable columns={columns} data={rows} loading={loading} emptyTitle="Nothing due today" />
    </>
  )
}
