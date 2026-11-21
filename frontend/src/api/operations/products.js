import { db } from '../../mocks/operations/db'
import { byId, matches, nextId, now, reject, respond } from '../../mocks/operations/mockServer'
import { http, toQuery, unwrap } from './http'

const USE_MOCK = true

// Adds computed stock fields: inStock (free units) and isLowStock (inStock < reorderLevel).
const withStock = (p) => {
  const inStock = p.trackSerial
    ? db.serialItems.filter((s) => s.product === p._id && s.status === 'in_stock').length
    : p.stockQty
  return { ...p, inStock, isLowStock: inStock < p.reorderLevel }
}

// params: { q, category, lowStock }
export async function getProducts(params = {}) {
  if (!USE_MOCK) return http('GET', `/products${toQuery(params)}`)
  let list = db.products.filter((p) => p.isActive).map(withStock)
  if (params.q) list = list.filter((p) => matches(p.name, params.q) || matches(p.sku, params.q) || matches(p.brand, params.q))
  if (params.category) list = list.filter((p) => p.category === params.category)
  if (params.lowStock) list = list.filter((p) => p.isLowStock)
  return unwrap(await respond(list))
}

export async function getProduct(id) {
  if (!USE_MOCK) return http('GET', `/products/${id}`)
  const p = byId('products', id)
  return unwrap(await (p ? respond(withStock(p)) : reject('Product not found')))
}

export async function createProduct(payload) {
  if (!USE_MOCK) return http('POST', '/products', payload)
  if (db.products.some((p) => p.sku === payload.sku)) return unwrap(await reject('SKU already exists'))
  const product = { stockQty: 0, isActive: true, ...payload, _id: nextId('prd', db.products), createdAt: now(), updatedAt: now() }
  db.products.push(product)
  return unwrap(await respond(withStock(product), 'Product created'))
}

export async function updateProduct(id, payload) {
  if (!USE_MOCK) return http('PUT', `/products/${id}`, payload)
  const p = byId('products', id)
  if (!p) return unwrap(await reject('Product not found'))
  Object.assign(p, payload, { updatedAt: now() })
  return unwrap(await respond(withStock(p), 'Product updated'))
}
