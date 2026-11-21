import { AlertCircle, FolderKanban, IndianRupee, LifeBuoy, Percent, UserPlus, Wallet } from 'lucide-react'
import { Card, EmptyState, PageHeader, StatCard } from '@/components/ui'
import { useAuth } from '@/context/AuthContext'

// Phase 0 shell. Phase 1 wires these to api/dashboard.js (mock first, then Dev 1's endpoints).
const KPIS = [
  { label: 'Total revenue', icon: IndianRupee, tone: 'orange' },
  { label: 'Collected', icon: Wallet, tone: 'green' },
  { label: 'Pending payments', icon: AlertCircle, tone: 'amber' },
  { label: 'Active projects', icon: FolderKanban, tone: 'blue' },
  { label: 'Leads', icon: UserPlus, tone: 'purple' },
  { label: 'Conversion', icon: Percent, tone: 'green' },
  { label: 'Open tickets', icon: LifeBuoy, tone: 'red' },
]

export default function Overview() {
  const { user } = useAuth()
  return (
    <>
      <PageHeader title={`Welcome, ${user?.name?.split(' ')[0] ?? ''}`} subtitle="Company performance at a glance" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {KPIS.map((k) => (
          <StatCard key={k.label} {...k} value="—" hint="Wiring up in Phase 1" />
        ))}
      </div>
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card title="Monthly revenue" subtitle="Revenue vs collected" className="lg:col-span-2">
          <EmptyState title="Chart coming soon" />
        </Card>
        <Card title="Pipeline by stage">
          <EmptyState title="Funnel coming soon" />
        </Card>
      </div>
    </>
  )
}
