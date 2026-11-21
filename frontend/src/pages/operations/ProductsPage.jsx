import { useMemo, useState } from 'react'
import { getProducts, PRODUCT_CATEGORIES } from '../../api/operations'
import OpsPageShell, { ShellStatus, StatCard } from './components/OpsPageShell'
import ProductFormModal from './components/ProductFormModal'
import { Badge, Button, inputClass } from './components/ui'
import { useApiData } from './useApiData'
import { formatINR, formatWarranty, labelize } from './utils'

export default function ProductsPage() {
  const { data: products, loading, error, reload } = useApiData(() => getProducts())
  const [q, setQ] = useState('')
  const [category, setCategory] = useState('')
  const [lowOnly, setLowOnly] = useState(false)
  const [modal, setModal] = useState({ open: false, product: null })
  const [toast, setToast] = useState('')

  const filtered = useMemo(() => {
    if (!products) return []
    const term = q.trim().toLowerCase()
    return products.filter(
      (p) =>
        (!term || [p.name, p.sku, p.brand].some((v) => v.toLowerCase().includes(term))) &&
        (!category || p.category === category) &&
        (!lowOnly || p.isLowStock),
    )
  }, [products, q, category, lowOnly])

  const lowCount = products?.filter((p) => p.isLowStock).length ?? 0

  const onSaved = (saved, isEdit) => {
    setModal({ open: false, product: null })
    setToast(isEdit ? `Updated ${saved.name}` : `Added ${saved.name}`)
    setTimeout(() => setToast(''), 3000)
    reload()
  }

  return (
    <OpsPageShell title="Products" description="Catalog of panels, inverters, batteries, structures and balance-of-system parts.">
      <ShellStatus loading={loading && !products} error={error}>
        {products && (
          <>
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <StatCard label="Products" value={products.length} />
              <StatCard label="Serial tracked" value={products.filter((p) => p.trackSerial).length} tone="blue" />
              <StatCard label="Low stock" value={lowCount} tone={lowCount ? 'red' : 'green'} />
              <StatCard label="Categories" value={new Set(products.map((p) => p.category)).size} />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <input
                className={`${inputClass} max-w-xs`}
                placeholder="Search name, SKU or brand"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
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
              <div className="ml-auto flex items-center gap-3">
                {toast && <span className="text-sm text-emerald-700">{toast}</span>}
                <Button onClick={() => setModal({ open: true, product: null })}>+ Add product</Button>
              </div>
            </div>

            <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Product</th>
                    <th className="px-4 py-3">SKU</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3 text-right">Price</th>
                    <th className="px-4 py-3 text-right">In stock</th>
                    <th className="px-4 py-3">Warranty</th>
                    <th className="px-4 py-3">Tracking</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((p) => (
                    <tr key={p._id} className={p.isLowStock ? 'bg-red-50/40' : ''}>
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-900">{p.name}</p>
                        <p className="text-xs text-slate-500">
                          {p.brand}
                          {p.specs ? ` · ${p.specs}` : ''}
                        </p>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-slate-700">{p.sku}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-700">{labelize(p.category)}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-right text-slate-900">
                        {formatINR(p.price)}
                        <span className="text-xs text-slate-500">/{p.unit}</span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right">
                        <span className={p.isLowStock ? 'font-semibold text-red-600' : 'text-slate-900'}>{p.inStock}</span>
                        <span className="text-xs text-slate-500"> / min {p.reorderLevel}</span>
                        {p.isLowStock && (
                          <div className="mt-1">
                            <Badge tone="red">Low stock</Badge>
                          </div>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-700">{formatWarranty(p.warrantyMonths)}</td>
                      <td className="whitespace-nowrap px-4 py-3">
                        {p.trackSerial ? <Badge tone="blue">Serial</Badge> : <Badge>Quantity</Badge>}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right">
                        <Button variant="ghost" onClick={() => setModal({ open: true, product: p })}>
                          Edit
                        </Button>
                      </td>
                    </tr>
                  ))}
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

      {modal.open && (
        <ProductFormModal
          key={modal.product?._id ?? 'new'}
          open
          product={modal.product}
          onClose={() => setModal({ open: false, product: null })}
          onSaved={onSaved}
        />
      )}
    </OpsPageShell>
  )
}
