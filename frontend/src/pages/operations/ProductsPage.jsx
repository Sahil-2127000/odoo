import { getProducts } from '../../api/operations'
import OpsPageShell, { ShellStatus, StatCard } from './components/OpsPageShell'
import { useApiData } from './useApiData'

export default function ProductsPage() {
  const { data, loading, error } = useApiData(() => getProducts())
  return (
    <OpsPageShell
      title="Products"
      description="Catalog of panels, inverters, batteries, structures and BOS parts."
      phase="Phase 1"
      todo={['Product table with search and category filter', 'Add / edit product modal', 'Low-stock flag when stock is below reorder level']}
    >
      <ShellStatus loading={loading} error={error}>
        {data && (
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard label="Products" value={data.length} />
            <StatCard label="Serial tracked" value={data.filter((p) => p.trackSerial).length} tone="blue" />
            <StatCard label="Low stock" value={data.filter((p) => p.isLowStock).length} tone="red" />
          </div>
        )}
      </ShellStatus>
    </OpsPageShell>
  )
}
