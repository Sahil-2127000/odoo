import { getWarranties } from '../../api/operations'
import OpsPageShell, { ShellStatus, StatCard } from './components/OpsPageShell'
import { useApiData } from './useApiData'

export default function WarrantiesPage() {
  const { data, loading, error } = useApiData(() => getWarranties())
  return (
    <OpsPageShell
      title="Warranties"
      description="Warranties start automatically when an installation is completed."
      phase="Phase 2"
      todo={['Warranty list with active / expired badge', 'Look up by serial number', 'Raise ticket from a warranty']}
    >
      <ShellStatus loading={loading} error={error}>
        {data && (
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard label="Active" value={data.filter((w) => w.status === 'active').length} tone="green" />
            <StatCard label="Expired" value={data.filter((w) => w.status === 'expired').length} tone="red" />
          </div>
        )}
      </ShellStatus>
    </OpsPageShell>
  )
}
