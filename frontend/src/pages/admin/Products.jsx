// /admin/products - list of parts we sell (panels, inverters, batteries...). Add and edit them.
import { useEffect, useState } from 'react'
import { Pencil, Plus } from 'lucide-react'
import { Badge, Button, DataTable, Input, Modal, PageHeader, Select, useToast } from '@/components/ui'
import { createProduct, getProducts, updateProduct } from '@/api/admin'
import { formatCurrency } from '@/utils/format'

// Same categories as the backend Product model
const CATEGORIES = [
  { value: 'panel', label: 'Panel' },
  { value: 'inverter', label: 'Inverter' },
  { value: 'battery', label: 'Battery' },
  { value: 'other', label: 'Other' },
]
const categoryLabel = (value) => CATEGORIES.find((c) => c.value === value)?.label ?? value

const EMPTY_PRODUCT = { name: '', category: 'panel', costPrice: '', sellPrice: '', stock: 0, minStock: 5, warrantyYears: 0 }

export default function Products() {
  const toast = useToast()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [category, setCategory] = useState('') // '' = all categories
  const [editing, setEditing] = useState(null) // null = form closed, {} = new product, product = edit it

  // Load the list from the API
  function loadProducts() {
    getProducts()
      .then(setProducts)
      .catch((err) => toast.error(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(loadProducts, []) // eslint-disable-line react-hooks/exhaustive-deps

  const shown = category ? products.filter((p) => p.category === category) : products
  const lowStockCount = products.filter((p) => p.stock < p.minStock).length

  const columns = [
    { key: 'name', header: 'Product', sortable: true, className: 'font-medium text-slate-900' },
    { key: 'category', header: 'Category', render: (p) => categoryLabel(p.category) },
    { key: 'costPrice', header: 'Cost price', align: 'right', sortable: true, render: (p) => formatCurrency(p.costPrice) },
    { key: 'sellPrice', header: 'Sell price', align: 'right', sortable: true, render: (p) => formatCurrency(p.sellPrice) },
    {
      key: 'margin',
      header: 'Margin',
      align: 'right',
      render: (p) => <span className="text-success-700">{formatCurrency(p.sellPrice - p.costPrice)}</span>,
    },
    {
      key: 'stock',
      header: 'Stock',
      sortable: true,
      render: (p) =>
        p.stock < p.minStock ? (
          <Badge tone="red">{p.stock} · Low</Badge>
        ) : (
          <Badge tone="green" dot={false}>
            {p.stock}
          </Badge>
        ),
    },
    { key: 'warrantyYears', header: 'Warranty', render: (p) => `${p.warrantyYears} yr` },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (p) => (
        <Button variant="ghost" size="sm" icon={Pencil} onClick={() => setEditing(p)}>
          Edit
        </Button>
      ),
    },
  ]

  // Called by the form after a successful save
  function handleSaved(message) {
    setEditing(null)
    toast.success(message)
    loadProducts()
  }

  return (
    <>
      <PageHeader
        title="Products"
        subtitle={`${products.length} products · ${lowStockCount} low on stock`}
        actions={
          <Button icon={Plus} onClick={() => setEditing({})}>
            Add product
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={shown}
        loading={loading}
        searchable
        searchKeys={['name']}
        searchPlaceholder="Search products..."
        toolbar={
          <Select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            options={CATEGORIES}
            placeholder="All categories"
          />
        }
        emptyTitle="No products yet"
        emptyDescription="Add panels, inverters and batteries you sell."
      />

      {/* The form is only created when open, so it always starts with fresh values */}
      {editing && <ProductForm product={editing} onClose={() => setEditing(null)} onSaved={handleSaved} />}
    </>
  )
}

// Pop-up form to add a new product or edit an existing one
function ProductForm({ product, onClose, onSaved }) {
  const isEdit = Boolean(product._id)
  const [form, setForm] = useState(isEdit ? product : EMPTY_PRODUCT)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)

  const change = (field) => (e) => setForm({ ...form, [field]: e.target.value })

  function validate() {
    const e = {}
    if (!form.name.trim()) e.name = 'Enter the product name'
    if (!(Number(form.costPrice) > 0)) e.costPrice = 'Enter a price above 0'
    if (!(Number(form.sellPrice) > 0)) e.sellPrice = 'Enter a price above 0'
    else if (Number(form.sellPrice) < Number(form.costPrice)) e.sellPrice = 'Sell price is lower than cost price'
    if (Number(form.stock) < 0) e.stock = 'Cannot be negative'
    return e
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const e = validate()
    setErrors(e)
    if (Object.keys(e).length) return

    // Send numbers as numbers, not text
    const data = {
      name: form.name.trim(),
      category: form.category,
      costPrice: Number(form.costPrice),
      sellPrice: Number(form.sellPrice),
      stock: Number(form.stock),
      minStock: Number(form.minStock),
      warrantyYears: Number(form.warrantyYears),
    }

    setSaving(true)
    try {
      if (isEdit) await updateProduct(product._id, data)
      else await createProduct(data)
      onSaved(isEdit ? 'Product updated' : 'Product added')
    } catch (err) {
      setErrors({ form: err.message })
      setSaving(false)
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={isEdit ? 'Edit product' : 'Add product'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="product-form" loading={saving}>
            {isEdit ? 'Save changes' : 'Add product'}
          </Button>
        </>
      }
    >
      <form id="product-form" onSubmit={handleSubmit} className="grid grid-cols-2 gap-4" noValidate>
        {errors.form && <p className="col-span-2 rounded-lg bg-danger-50 px-3 py-2 text-sm text-danger-700">{errors.form}</p>}
        <Input className="col-span-2" label="Name" required value={form.name} onChange={change('name')} error={errors.name} placeholder="e.g. Mono PERC Panel 540 W" />
        <Select className="col-span-2" label="Category" value={form.category} onChange={change('category')} options={CATEGORIES} />
        <Input label="Cost price (₹)" type="number" required value={form.costPrice} onChange={change('costPrice')} error={errors.costPrice} hint="What we pay" />
        <Input label="Sell price (₹)" type="number" required value={form.sellPrice} onChange={change('sellPrice')} error={errors.sellPrice} hint="What the customer pays" />
        <Input label="Stock" type="number" value={form.stock} onChange={change('stock')} error={errors.stock} />
        <Input label="Low-stock alert below" type="number" value={form.minStock} onChange={change('minStock')} />
        <Input label="Warranty (years)" type="number" value={form.warrantyYears} onChange={change('warrantyYears')} />
      </form>
    </Modal>
  )
}
