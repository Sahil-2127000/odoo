import { getTechnicians } from '../../api/operations'
import OpsPageShell, { ShellStatus, StatCard } from './components/OpsPageShell'
import { useApiData } from './useApiData'

export default function TechniciansPage() {
  const { data, loading, error } = useApiData(() => getTechnicians())
  const count = (s) => data?.filter((t) => t.status === s).length
  return (
    <OpsPageShell
      title="Technicians"
      description="Installation and service crew."
      phase="Phase 1"
      todo={['Technician list', 'Add technician', 'Availability status: available / on job / leave']}
    >
      <ShellStatus loading={loading} error={error}>
        {data && (
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard label="Available" value={count('available')} tone="green" />
            <StatCard label="On job" value={count('on_job')} tone="blue" />
            <StatCard label="On leave" value={count('leave')} tone="amber" />
          </div>
        )}
      </ShellStatus>
    </OpsPageShell>
  )
}
