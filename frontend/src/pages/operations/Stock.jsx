// /operations - products with a LOW badge, add stock.
import { useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import { Badge, Button, DataTable, Input, Modal, PageHeader, useToast } from '@/components/ui'
import { addStock, getProducts } from '@/api/operations/products'
import { formatCurrency } from '@/utils/format'

export default function Stock() {
  const toast = useToast()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [target, setTarget] = useState(null) // product being stocked in

  function load() {
    getProducts()
      .then(setProducts)
      .catch((err) => toast.error(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(load, []) // eslint-disable-line react-hooks/exhaustive-deps

  const columns = [
    { key: 'name', header: 'Product', sortable: true },
    { key: 'category', header: 'Category' },
    { key: 'sellPrice', header: 'Sell price', align: 'right', render: (p) => formatCurrency(p.sellPrice) },
    {
      key: 'stock',
      header: 'Stock',
      align: 'right',
      render: (p) => (
        <span className="inline-flex items-center gap-2">
          {p.stock}
          {p.stock < p.minStock && <Badge tone="red">Low</Badge>}
        </span>
      ),
    },
    { key: 'minStock', header: 'Min stock', align: 'right' },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (p) => (
        <Button size="sm" icon={Plus} onClick={() => setTarget(p)}>
          Stock in
        </Button>
      ),
    },
  ]

  return (
    <>
      <PageHeader title="Stock" subtitle="Products on hand across all categories" />

      <DataTable
        columns={columns}
        data={products}
        loading={loading}
        searchable
        searchKeys={['name', 'category']}
        emptyTitle="No products"
      />

      {target && (
        <StockInModal
          product={target}
          onClose={() => setTarget(null)}
          onDone={() => {
            setTarget(null)
            load()
          }}
        />
      )}
    </>
  )
}

function StockInModal({ product, onClose, onDone }) {
  const toast = useToast()
  const [quantity, setQuantity] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    const n = Number(quantity)
    if (!n || n <= 0) return
    setSaving(true)
    try {
      await addStock(product._id, n)
      toast.success(`Added ${n} to ${product.name}`)
      onDone()
    } catch (err) {
      toast.error(err.message)
      setSaving(false)
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={`Stock in - ${product.name}`}
      description={`Currently ${product.stock} in stock`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="stock-in-form" loading={saving} disabled={!quantity}>
            Add stock
          </Button>
        </>
      }
    >
      <form id="stock-in-form" onSubmit={handleSubmit}>
        <Input
          label="Quantity received"
          type="number"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          autoFocus
        />
      </form>
    </Modal>
  )
}
