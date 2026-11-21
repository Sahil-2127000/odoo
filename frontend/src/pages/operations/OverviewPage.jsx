import { getInstallations, getProducts, getTechnicians, getTickets } from '../../api/operations'
import OpsPageShell, { ShellStatus, StatCard } from './components/OpsPageShell'
import { useApiData } from './useApiData'

const loadOverview = async () => {
  const [products, installations, tickets, technicians] = await Promise.all([
    getProducts({ lowStock: true }),
    getInstallations({ status: 'scheduled' }),
    getTickets(),
    getTechnicians(),
  ])
  return {
    lowStock: products.length,
    upcoming: installations.length,
    openTickets: tickets.filter((t) => !['resolved', 'closed'].includes(t.status)).length,
    available: technicians.filter((t) => t.status === 'available').length,
    totalTechs: technicians.length,
  }
}

export default function OverviewPage() {
  const { data, loading, error } = useApiData(loadOverview)
  return (
    <OpsPageShell
      title="Operations Overview"
      description="Stock, installations, service and crew at a glance."
      phase="Phase 2"
      todo={[
        'Low-stock alerts list with link to stock-in',
        'Upcoming installations (next 7 days) grouped by date',
        'Open tickets by priority',
        'Technician availability',
      ]}
    >
      <ShellStatus loading={loading} error={error}>
        {data && (
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard label="Low-stock products" value={data.lowStock} tone="red" />
            <StatCard label="Upcoming installations" value={data.upcoming} tone="blue" />
            <StatCard label="Open tickets" value={data.openTickets} tone="amber" />
            <StatCard label="Technicians available" value={`${data.available} / ${data.totalTechs}`} tone="green" />
          </div>
        )}
      </ShellStatus>
    </OpsPageShell>
  )
}
