import { getStockSummary } from '../../api/operations'
import OpsPageShell, { ShellStatus, StatCard } from './components/OpsPageShell'
import { useApiData } from './useApiData'

export default function InventoryPage() {
  const { data, loading, error } = useApiData(getStockSummary)
  const sum = (key) => data?.filter((r) => r.product.trackSerial).reduce((n, r) => n + r[key], 0)
  return (
    <OpsPageShell
      title="Inventory"
      description="Stock per product: in stock, reserved and installed."
      phase="Phase 1"
      todo={['Stock table per product (in stock / reserved / installed)', 'Stock-in modal: paste or type multiple serial numbers', 'Serial list per product']}
    >
      <ShellStatus loading={loading} error={error}>
        {data && (
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard label="Serial units in stock" value={sum('inStock')} tone="green" />
            <StatCard label="Reserved" value={sum('reserved')} tone="amber" />
            <StatCard label="Installed" value={sum('installed')} tone="blue" />
            <StatCard label="Low-stock products" value={data.filter((r) => r.isLowStock).length} tone="red" />
          </div>
        )}
      </ShellStatus>
    </OpsPageShell>
  )
}
