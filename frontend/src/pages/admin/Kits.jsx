// /admin/kits - ready-made packages built from products (e.g. "3 kW On-Grid Kit"). Create and delete them.
import { useEffect, useState } from 'react'
import { Package, Plus, Trash2, X } from 'lucide-react'
import { Button, ConfirmDialog, EmptyState, Input, Loader, Modal, PageHeader, Select, useToast } from '@/components/ui'
import { createKit, deleteKit, getKits, getProducts, kitPrice } from '@/api/admin'
import { formatCurrency } from '@/utils/format'

export default function Kits() {
  const toast = useToast()
  const [kits, setKits] = useState([])
  const [products, setProducts] = useState([]) // needed for the "new kit" form
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [kitToDelete, setKitToDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)

  function loadKits() {
    Promise.all([getKits(), getProducts()])
      .then(([kitList, productList]) => {
        setKits(kitList)
        setProducts(productList)
      })
      .catch((err) => toast.error(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(loadKits, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleDelete() {
    setDeleting(true)
    try {
      await deleteKit(kitToDelete._id)
      toast.success(`${kitToDelete.name} deleted`)
      setKitToDelete(null)
      loadKits()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setDeleting(false)
    }
  }

  function handleCreated() {
    setFormOpen(false)
    toast.success('Kit created')
    loadKits()
  }

  return (
    <>
      <PageHeader
        title="Kits"
        subtitle="Packages that Sales can quote to customers"
        actions={
          <Button icon={Plus} onClick={() => setFormOpen(true)} disabled={loading}>
            New kit
          </Button>
        }
      />

      {loading ? (
        <Loader />
      ) : kits.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No kits yet"
          description="Create a kit by picking products and quantities."
          action={<Button icon={Plus} onClick={() => setFormOpen(true)}>New kit</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {kits.map((kit) => (
            <KitCard key={kit._id} kit={kit} onDelete={() => setKitToDelete(kit)} />
          ))}
        </div>
      )}

      {formOpen && <KitForm products={products} onClose={() => setFormOpen(false)} onCreated={handleCreated} />}

      <ConfirmDialog
        open={Boolean(kitToDelete)}
        title="Delete kit?"
        message={`"${kitToDelete?.name}" will be removed. Orders already made with it are not affected.`}
        confirmText="Delete"
        loading={deleting}
        onConfirm={handleDelete}
        onClose={() => setKitToDelete(null)}
      />
    </>
  )
}

// One kit: name, price and the list of products inside it
function KitCard({ kit, onDelete }) {
  return (
    <div className="flex flex-col rounded-card border border-slate-200 bg-white p-5 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-slate-900">{kit.name}</h3>
          <p className="mt-1 text-xl font-semibold text-primary-600">{formatCurrency(kit.price)}</p>
        </div>
        <Button variant="ghost" size="icon" onClick={onDelete} aria-label={`Delete ${kit.name}`}>
          <Trash2 className="h-4 w-4 text-danger-500" />
        </Button>
      </div>
      <ul className="mt-4 space-y-2 border-t border-slate-100 pt-4 text-sm">
        {kit.items.map((item, i) => (
          <li key={i} className="flex justify-between gap-3">
            <span className="text-slate-700">{item.product?.name ?? 'Deleted product'}</span>
            <span className="shrink-0 text-slate-500">× {item.qty}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

// Pop-up form: kit name + rows of (product, quantity). The price is worked out as you type.
function KitForm({ products, onClose, onCreated }) {
  const [name, setName] = useState('')
  const [items, setItems] = useState([{ product: '', qty: 1 }])
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const productOptions = products.map((p) => ({ value: p._id, label: `${p.name} (${formatCurrency(p.sellPrice)})` }))
  const price = kitPrice(
    items.map((i) => ({ ...i, qty: Number(i.qty) })),
    products,
  )

  // Change one field of one row
  const updateItem = (index, field, value) =>
    setItems(items.map((item, i) => (i === index ? { ...item, [field]: value } : item)))
  const addItem = () => setItems([...items, { product: '', qty: 1 }])
  const removeItem = (index) => setItems(items.filter((_, i) => i !== index))

  async function handleSubmit(event) {
    event.preventDefault()
    const filled = items.filter((i) => i.product)
    if (!name.trim()) return setError('Enter a kit name')
    if (filled.length === 0) return setError('Add at least one product')
    if (filled.some((i) => !(Number(i.qty) > 0))) return setError('Every quantity must be at least 1')
    if (new Set(filled.map((i) => i.product)).size !== filled.length) return setError('A product is added twice')

    setSaving(true)
    try {
      await createKit({ name: name.trim(), items: filled.map((i) => ({ product: i.product, qty: Number(i.qty) })) })
      onCreated()
    } catch (err) {
      setError(err.message)
      setSaving(false)
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="New kit"
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="kit-form" loading={saving}>
            Create kit
          </Button>
        </>
      }
    >
      <form id="kit-form" onSubmit={handleSubmit} className="space-y-4" noValidate>
        {error && <p className="rounded-lg bg-danger-50 px-3 py-2 text-sm text-danger-700">{error}</p>}
        <Input label="Kit name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. 3 kW On-Grid Kit" />

        <div>
          <p className="mb-2 text-sm font-medium text-slate-700">Products in this kit</p>
          <div className="space-y-2">
            {items.map((item, index) => (
              <div key={index} className="flex items-end gap-2">
                <Select
                  className="flex-1"
                  value={item.product}
                  onChange={(e) => updateItem(index, 'product', e.target.value)}
                  options={productOptions}
                  placeholder="Choose a product"
                  aria-label="Product"
                />
                <Input
                  className="w-20"
                  type="number"
                  min="1"
                  value={item.qty}
                  onChange={(e) => updateItem(index, 'qty', e.target.value)}
                  aria-label="Quantity"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeItem(index)}
                  disabled={items.length === 1}
                  aria-label="Remove row"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
          <Button variant="link" size="sm" icon={Plus} onClick={addItem} className="mt-3">
            Add another product
          </Button>
        </div>

        <div className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3">
          <span className="text-sm text-slate-600">Kit price (sell price × quantity)</span>
          <span className="text-lg font-semibold text-slate-900">{formatCurrency(price)}</span>
        </div>
      </form>
    </Modal>
  )
}
