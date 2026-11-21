import { db } from '../../mocks/operations/db'
import { byId, matches, nextId, now, reject, respond } from '../../mocks/operations/mockServer'
import { http, unwrap } from './http'

// Keep true until backend mounts /api/v1/products (product.route.js exists but is not in index.js yet).
const USE_MOCK = true

export const PRODUCT_CATEGORIES = [
  'solar_panel',
  'inverter',
  'battery',
  'charge_controller',
  'mounting_structure',
  'cable',
  'electrical',
  'accessory',
]

export const PRODUCT_UNITS = ['pcs', 'set', 'm', 'pair']

// ---------- Backend adapter ----------
// Backend Product model: { name, category: panel|inverter|battery|other, costPrice, sellPrice, stock, minStock, warrantyYears }
// The pages use the frontend shape below, so only these two functions change if the model changes.
const TO_API_CATEGORY = { solar_panel: 'panel', inverter: 'inverter', battery: 'battery' }
const FROM_API_CATEGORY = { panel: 'solar_panel', inverter: 'inverter', battery: 'battery', other: 'accessory' }

export const fromApiProduct = (p) => ({
  _id: p._id,
  name: p.name,
  sku: p.sku ?? '',
  brand: p.brand ?? '',
  specs: p.specs ?? '',
  unit: p.unit ?? 'pcs',
  category: FROM_API_CATEGORY[p.category] ?? 'accessory',
  price: p.sellPrice,
  costPrice: p.costPrice,
  warrantyMonths: (p.warrantyYears ?? 0) * 12,
  reorderLevel: p.minStock ?? 0,
  trackSerial: false, // backend has no serial numbers yet; stock is a plain count
  stockQty: p.stock ?? 0,
  inStock: p.stock ?? 0,
  isLowStock: (p.stock ?? 0) < (p.minStock ?? 0),
  isActive: true,
})

const toApiProduct = (p) => ({
  name: p.name,
  category: TO_API_CATEGORY[p.category] ?? 'other',
  costPrice: p.costPrice,
  sellPrice: p.price,
  minStock: p.reorderLevel,
  warrantyYears: Math.round((p.warrantyMonths ?? 0) / 12),
})

// ---------- Mock helpers ----------
// Adds computed stock fields: inStock (free units) and isLowStock (inStock < reorderLevel).
const withStock = (p) => {
  const inStock = p.trackSerial
    ? db.serialItems.filter((s) => s.product === p._id && s.status === 'in_stock').length
    : p.stockQty
  return { ...p, inStock, isLowStock: inStock < p.reorderLevel }
}

const applyFilters = (list, params) => {
  let out = list
  if (params.q) out = out.filter((p) => matches(p.name, params.q) || matches(p.sku, params.q) || matches(p.brand, params.q))
  if (params.category) out = out.filter((p) => p.category === params.category)
  if (params.lowStock) out = out.filter((p) => p.isLowStock)
  return out
}

// params: { q, category, lowStock }  (backend returns everything; filtering happens here either way)
export async function getProducts(params = {}) {
  if (!USE_MOCK) return applyFilters((await http('GET', '/products')).map(fromApiProduct), params)
  const list = db.products.filter((p) => p.isActive).map(withStock)
  return unwrap(await respond(applyFilters(list, params)))
}

export async function getProduct(id) {
  if (!USE_MOCK) {
    const p = (await getProducts()).find((x) => x._id === id)
    if (!p) throw new Error('Product not found')
    return p
  }
  const p = byId('products', id)
  return unwrap(await (p ? respond(withStock(p)) : reject('Product not found')))
}

// Backend: POST /products is admin-only.
export async function createProduct(payload) {
  if (!USE_MOCK) return fromApiProduct(await http('POST', '/products', toApiProduct(payload)))
  if (db.products.some((p) => p.sku === payload.sku)) return unwrap(await reject('SKU already exists'))
  const product = { stockQty: 0, isActive: true, ...payload, _id: nextId('prd', db.products), createdAt: now(), updatedAt: now() }
  db.products.push(product)
  return unwrap(await respond(withStock(product), 'Product created'))
}

// Backend: PUT /products/:id is admin-only.
export async function updateProduct(id, payload) {
  if (!USE_MOCK) return fromApiProduct(await http('PUT', `/products/${id}`, toApiProduct(payload)))
  const p = byId('products', id)
  if (!p) return unwrap(await reject('Product not found'))
  Object.assign(p, payload, { updatedAt: now() })
  return unwrap(await respond(withStock(p), 'Product updated'))
}

// Backend: PATCH /products/:id/stock { quantity } (warehouse). Used by inventory stock-in for count-based products.
export async function addProductStock(id, quantity) {
  return fromApiProduct(await http('PATCH', `/products/${id}/stock`, { quantity }))
}
