import { useMemo, useState } from 'react'
import { getStockSummary, PRODUCT_CATEGORIES } from '../../api/operations'
import OpsPageShell, { ShellStatus, StatCard } from './components/OpsPageShell'
import SerialListModal from './components/SerialListModal'
import StockInModal from './components/StockInModal'
import { Badge, Button, inputClass } from './components/ui'
import { useApiData } from './useApiData'
import { labelize } from './utils'

export default function InventoryPage() {
  const { data: rows, loading, error, reload } = useApiData(getStockSummary)
  const [q, setQ] = useState('')
  const [category, setCategory] = useState('')
  const [lowOnly, setLowOnly] = useState(false)
  const [stockIn, setStockIn] = useState({ open: false, productId: null })
  const [serialsFor, setSerialsFor] = useState(null)

  const filtered = useMemo(() => {
    if (!rows) return []
    const term = q.trim().toLowerCase()
    return rows.filter(
      (r) =>
        (!term || [r.product.name, r.product.sku, r.product.brand].some((v) => v.toLowerCase().includes(term))) &&
        (!category || r.product.category === category) &&
        (!lowOnly || r.isLowStock),
    )
  }, [rows, q, category, lowOnly])

  const serialRows = rows?.filter((r) => r.product.trackSerial) ?? []
  const sum = (key) => serialRows.reduce((n, r) => n + r[key], 0)
  const lowCount = rows?.filter((r) => r.isLowStock).length ?? 0

  return (
    <OpsPageShell title="Inventory" description="Stock per product. Serial-tracked items are counted unit by unit from their serial numbers.">
      <ShellStatus loading={loading && !rows} error={error}>
        {rows && (
          <>
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <StatCard label="Serial units in stock" value={sum('inStock')} tone="green" />
              <StatCard label="Reserved for orders" value={sum('reserved')} tone="amber" />
              <StatCard label="Installed at sites" value={sum('installed')} tone="blue" />
              <StatCard label="Low-stock products" value={lowCount} tone={lowCount ? 'red' : 'green'} />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <input className={`${inputClass} max-w-xs`} placeholder="Search name, SKU or brand" value={q} onChange={(e) => setQ(e.target.value)} />
              <select className={`${inputClass} max-w-[200px]`} value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="">All categories</option>
                {PRODUCT_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {labelize(c)}
                  </option>
                ))}
              </select>
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input type="checkbox" className="h-4 w-4 accent-red-500" checked={lowOnly} onChange={(e) => setLowOnly(e.target.checked)} />
                Low stock only
              </label>
              <Button className="ml-auto" onClick={() => setStockIn({ open: true, productId: null })}>
                + Stock in
              </Button>
            </div>

            <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50 text-xs font-medium uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3 text-left">Product</th>
                    <th className="px-4 py-3 text-right">In stock</th>
                    <th className="px-4 py-3 text-right">Reserved</th>
                    <th className="px-4 py-3 text-right">Installed</th>
                    <th className="px-4 py-3 text-right">Defective</th>
                    <th className="px-4 py-3 text-right">Reorder at</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((r) => {
                    const tracked = r.product.trackSerial
                    const dash = <span className="text-slate-300">-</span>
                    return (
                      <tr key={r.product._id} className={r.isLowStock ? 'bg-red-50/40' : ''}>
                        <td className="px-4 py-3">
                          <p className="font-medium text-slate-900">{r.product.name}</p>
                          <p className="text-xs text-slate-500">
                            <span className="font-mono">{r.product.sku}</span> · {labelize(r.product.category)} ·{' '}
                            {tracked ? 'serial tracked' : `counted in ${r.unit}`}
                          </p>
                        </td>
                        <td className={`px-4 py-3 text-right font-semibold ${r.isLowStock ? 'text-red-600' : 'text-emerald-700'}`}>{r.inStock}</td>
                        <td className="px-4 py-3 text-right text-amber-700">{tracked ? r.reserved : dash}</td>
                        <td className="px-4 py-3 text-right text-sky-700">{tracked ? r.installed : dash}</td>
                        <td className="px-4 py-3 text-right text-red-600">{tracked ? r.defective || 0 : dash}</td>
                        <td className="px-4 py-3 text-right text-slate-600">{r.reorderLevel}</td>
                        <td className="px-4 py-3">{r.isLowStock ? <Badge tone="red">Low stock</Badge> : <Badge tone="green">OK</Badge>}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-right">
                          {tracked && (
                            <Button variant="ghost" onClick={() => setSerialsFor(r.product)}>
                              Serials
                            </Button>
                          )}
                          <Button variant="secondary" onClick={() => setStockIn({ open: true, productId: r.product._id })}>
                            Stock in
                          </Button>
                        </td>
                      </tr>
                    )
                  })}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={8} className="px-4 py-10 text-center text-sm text-slate-500">
                        No products match these filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </ShellStatus>

      {stockIn.open && rows && (
        <StockInModal
          key={stockIn.productId ?? 'any'}
          open
          rows={rows}
          productId={stockIn.productId}
          onClose={() => setStockIn({ open: false, productId: null })}
          onDone={reload}
        />
      )}

      {serialsFor && <SerialListModal open product={serialsFor} onClose={() => setSerialsFor(null)} />}
    </OpsPageShell>
  )
}
