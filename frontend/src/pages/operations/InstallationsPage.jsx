import { getInstallations } from '../../api/operations'
import OpsPageShell, { ShellStatus, StatCard } from './components/OpsPageShell'
import { useApiData } from './useApiData'

export default function InstallationsPage() {
  const { data, loading, error } = useApiData(() => getInstallations())
  const count = (s) => data?.filter((i) => i.status === s).length
  return (
    <OpsPageShell
      title="Installations"
      description="Schedule crews for reserved orders and track jobs to completion."
      phase="Phase 2"
      todo={[
        'Schedule installation for a reserved order (date + technicians)',
        'Status board: scheduled / in progress / completed, grouped by date',
        'Mark complete: warranties auto-created',
      ]}
    >
      <ShellStatus loading={loading} error={error}>
        {data && (
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard label="Scheduled" value={count('scheduled')} tone="blue" />
            <StatCard label="In progress" value={count('in_progress')} tone="amber" />
            <StatCard label="Completed" value={count('completed')} tone="green" />
          </div>
        )}
      </ShellStatus>
    </OpsPageShell>
  )
}
