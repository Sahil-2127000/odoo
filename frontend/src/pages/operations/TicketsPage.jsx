import { getTickets } from '../../api/operations'
import OpsPageShell, { ShellStatus, StatCard } from './components/OpsPageShell'
import { useApiData } from './useApiData'

const isOpen = (t) => !['resolved', 'closed'].includes(t.status)

export default function TicketsPage() {
  const { data, loading, error } = useApiData(() => getTickets())
  const open = data?.filter(isOpen) ?? []
  return (
    <OpsPageShell
      title="Service Tickets"
      description="Complaints, service visits and warranty claims, tracked until resolved."
      phase="Phase 2"
      todo={['Create ticket (from warranty lookup or customer)', 'Type, priority, assign technician', 'Update status + resolution notes']}
    >
      <ShellStatus loading={loading} error={error}>
        {data && (
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard label="Open" value={open.length} tone="amber" />
            <StatCard label="Urgent / high" value={open.filter((t) => ['urgent', 'high'].includes(t.priority)).length} tone="red" />
            <StatCard label="Resolved" value={data.length - open.length} tone="green" />
          </div>
        )}
      </ShellStatus>
    </OpsPageShell>
  )
}
