import { getOrdersToFulfil } from '../../api/operations'
import OpsPageShell, { ShellStatus, StatCard } from './components/OpsPageShell'
import { useApiData } from './useApiData'

export default function FulfilmentPage() {
  const { data, loading, error } = useApiData(() => getOrdersToFulfil({ status: 'confirmed' }))
  return (
    <OpsPageShell
      title="Orders to Fulfil"
      description="Confirmed orders waiting for inventory reservation."
      phase="Phase 2"
      todo={['List orders awaiting reservation', 'Pick serials per product line', 'Reserve button (non-serial lines deducted automatically)']}
    >
      <ShellStatus loading={loading} error={error}>
        {data && (
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard label="Awaiting reservation" value={data.length} tone="amber" />
          </div>
        )}
      </ShellStatus>
    </OpsPageShell>
  )
}
