// Living reference for the shared UI kit: /admin/ui-kit
import { useState } from 'react'
import { IndianRupee, Plus, Search, Trash2, Zap } from 'lucide-react'
import {
  Badge,
  Button,
  Card,
  DataTable,
  EmptyState,
  Input,
  Loader,
  Modal,
  PageHeader,
  Select,
  StatCard,
  Tabs,
  Textarea,
} from '@/components/ui'
import { STATUS_COLORS } from '@/constants/status'
import { formatCurrency, formatDate, formatKw } from '@/utils/format'

const rows = [
  { _id: '1', name: 'Rohit Verma', systemSize: 3, total: 185000, status: 'confirmed', createdAt: '2026-11-02' },
  { _id: '2', name: 'Anita Kaur', systemSize: 5, total: 320000, status: 'in_progress', createdAt: '2026-11-10' },
  { _id: '3', name: 'Gill Traders', systemSize: 2, total: 125000, status: 'completed', createdAt: '2026-10-21' },
  { _id: '4', name: 'Meena Joshi', systemSize: 1, total: 68000, status: 'cancelled', createdAt: '2026-10-15' },
]

export default function UiKit() {
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState('all')
  const [status, setStatus] = useState('')
  const data = status ? rows.filter((r) => r.status === status) : rows

  return (
    <>
      <PageHeader
        title="UI kit"
        subtitle="Shared components — import from @/components/ui"
        actions={<Button icon={Plus} onClick={() => setOpen(true)}>Open modal</Button>}
      />

      <div className="space-y-6">
        <Card title="Buttons">
          <div className="flex flex-wrap items-center gap-3">
            <Button>Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="danger" icon={Trash2}>Danger</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="link">Link</Button>
            <Button loading>Saving</Button>
            <Button size="sm">Small</Button>
            <Button size="lg">Large</Button>
          </div>
        </Card>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Total revenue" value={formatCurrency(1850000)} icon={IndianRupee} trend={12.4} hint="vs last month" />
          <StatCard label="Capacity sold" value={formatKw(42)} icon={Zap} tone="blue" trend={-3.1} hint="vs last month" />
          <StatCard label="Compact" value={formatCurrency(1850000, { compact: true })} tone="green" />
          <StatCard label="Loading" loading icon={IndianRupee} tone="gray" />
        </div>

        <Card title="Badges" subtitle="<Badge status='...' /> — colours come from STATUS_COLORS">
          <div className="flex flex-wrap gap-2">
            {Object.keys(STATUS_COLORS).map((s) => (
              <Badge key={s} status={s} />
            ))}
          </div>
        </Card>

        <Card title="Form controls">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Input label="Customer name" placeholder="e.g. Rohit Verma" required />
            <Input label="Search" icon={Search} placeholder="Search..." />
            <Select label="System type" placeholder="Choose..." options={[{ value: 'on_grid', label: 'On-Grid' }, { value: 'off_grid', label: 'Off-Grid' }]} />
            <Input label="With error" error="Phone number is required" />
            <Textarea label="Notes" className="md:col-span-2" hint="Visible to the sales team" />
          </div>
        </Card>

        <Tabs
          value={tab}
          onChange={setTab}
          tabs={[
            { value: 'all', label: 'All', count: 4 },
            { value: 'active', label: 'Active', count: 2 },
            { value: 'closed', label: 'Closed' },
          ]}
        />

        <DataTable
          columns={[
            { key: 'name', header: 'Customer', sortable: true },
            { key: 'systemSize', header: 'System', render: (r) => formatKw(r.systemSize), sortable: true },
            { key: 'total', header: 'Amount', align: 'right', render: (r) => formatCurrency(r.total), sortable: true },
            { key: 'status', header: 'Status', render: (r) => <Badge status={r.status} /> },
            { key: 'createdAt', header: 'Created', render: (r) => formatDate(r.createdAt), sortable: true },
          ]}
          data={data}
          searchable
          searchKeys={['name']}
          pageSize={3}
          toolbar={
            <Select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              placeholder="All statuses"
              options={['confirmed', 'in_progress', 'completed', 'cancelled']}
            />
          }
        />

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <Card title="EmptyState">
            <EmptyState title="No tickets" description="Service tickets will appear here." action={<Button size="sm">New ticket</Button>} />
          </Card>
          <Card title="Loader">
            <Loader label="Loading projects..." className="py-12" />
          </Card>
        </div>
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Add user"
        description="Example modal with a form"
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={() => setOpen(false)}>Save</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input label="Name" required />
          <Select label="Role" options={['admin', 'sales', 'operations']} />
        </div>
      </Modal>
    </>
  )
}
