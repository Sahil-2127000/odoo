import { useState } from 'react'
import { createProduct, PRODUCT_CATEGORIES, PRODUCT_UNITS, updateProduct } from '../../../api/operations'
import { labelize } from '../utils'
import { Button, Field, inputClass, Modal } from './ui'

const EMPTY = {
  name: '',
  sku: '',
  brand: '',
  category: 'solar_panel',
  unit: 'pcs',
  price: '',
  costPrice: '',
  warrantyMonths: '',
  reorderLevel: '',
  trackSerial: true,
  specs: '',
}

const NUMBER_FIELDS = ['price', 'costPrice', 'warrantyMonths', 'reorderLevel']

const validate = (f) => {
  const e = {}
  if (!f.name.trim()) e.name = 'Name is required'
  if (!f.sku.trim()) e.sku = 'SKU is required'
  if (!f.brand.trim()) e.brand = 'Brand is required'
  for (const key of NUMBER_FIELDS) {
    if (f[key] === '' || Number.isNaN(Number(f[key]))) e[key] = 'Enter a number'
    else if (Number(f[key]) < 0) e[key] = 'Cannot be negative'
  }
  return e
}

// product = null -> add mode; product = object -> edit mode.
// Parent should mount this with a `key` so the form resets per product.
export default function ProductFormModal({ open, product, onClose, onSaved }) {
  const isEdit = Boolean(product)
  const [form, setForm] = useState(() => (product ? { ...EMPTY, ...product } : EMPTY))
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [serverError, setServerError] = useState('')

  const set = (key) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setForm((f) => ({ ...f, [key]: value }))
  }

  const submit = async (e) => {
    e.preventDefault()
    const found = validate(form)
    setErrors(found)
    if (Object.keys(found).length) return

    const payload = {
      name: form.name.trim(),
      sku: form.sku.trim().toUpperCase(),
      brand: form.brand.trim(),
      category: form.category,
      unit: form.unit,
      trackSerial: form.trackSerial,
      specs: form.specs.trim(),
      ...Object.fromEntries(NUMBER_FIELDS.map((k) => [k, Number(form[k])])),
    }

    setSaving(true)
    setServerError('')
    try {
      const saved = isEdit ? await updateProduct(product._id, payload) : await createProduct(payload)
      onSaved(saved, isEdit)
    } catch (err) {
      setServerError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={open}
      title={isEdit ? `Edit ${product.name}` : 'Add product'}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="product-form" disabled={saving}>
            {saving ? 'Saving...' : isEdit ? 'Save changes' : 'Add product'}
          </Button>
        </>
      }
    >
      <form id="product-form" onSubmit={submit} className="grid grid-cols-1 gap-4 sm:grid-cols-2" noValidate>
        {serverError && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 sm:col-span-2">{serverError}</p>}

        <div className="sm:col-span-2">
          <Field label="Product name" error={errors.name}>
            <input className={inputClass} value={form.name} onChange={set('name')} placeholder="Waaree 540W Mono PERC Panel" />
          </Field>
        </div>
        <Field label="SKU" error={errors.sku}>
          <input className={`${inputClass} uppercase`} value={form.sku} onChange={set('sku')} placeholder="PNL-WAA-540-MONO" />
        </Field>
        <Field label="Brand" error={errors.brand}>
          <input className={inputClass} value={form.brand} onChange={set('brand')} placeholder="Waaree" />
        </Field>
        <Field label="Category">
          <select className={inputClass} value={form.category} onChange={set('category')}>
            {PRODUCT_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {labelize(c)}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Unit">
          <select className={inputClass} value={form.unit} onChange={set('unit')}>
            {PRODUCT_UNITS.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Selling price (₹)" error={errors.price}>
          <input className={inputClass} type="number" min="0" value={form.price} onChange={set('price')} />
        </Field>
        <Field label="Cost price (₹)" error={errors.costPrice}>
          <input className={inputClass} type="number" min="0" value={form.costPrice} onChange={set('costPrice')} />
        </Field>
        <Field label="Warranty (months)" error={errors.warrantyMonths} hint="e.g. 240 for panels, 24 for inverters">
          <input className={inputClass} type="number" min="0" value={form.warrantyMonths} onChange={set('warrantyMonths')} />
        </Field>
        <Field label="Reorder level" error={errors.reorderLevel} hint="Low-stock alert below this quantity">
          <input className={inputClass} type="number" min="0" value={form.reorderLevel} onChange={set('reorderLevel')} />
        </Field>
        <div className="sm:col-span-2">
          <Field label="Specs">
            <input className={inputClass} value={form.specs} onChange={set('specs')} placeholder="540 Wp, mono PERC, 144 half-cut cells" />
          </Field>
        </div>
        <label className="flex items-start gap-2 sm:col-span-2">
          <input
            type="checkbox"
            className="mt-0.5 h-4 w-4 accent-amber-500"
            checked={form.trackSerial}
            onChange={set('trackSerial')}
            disabled={isEdit}
          />
          <span className="text-sm text-slate-700">
            Track serial numbers
            <span className="block text-xs text-slate-500">
              {isEdit
                ? 'Cannot be changed after the product is created.'
                : 'Each unit gets its own serial and warranty (panels, inverters, batteries, charge controllers).'}
            </span>
          </span>
        </label>
      </form>
    </Modal>
  )
}
