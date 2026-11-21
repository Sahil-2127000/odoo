// Inventory: stock summary, serial items (stock-in, lookup) and order reservation.
import { db } from '../../mocks/operations/db'
import { byId, matches, nextId, now, refs, reject, respond, warrantyStatus } from '../../mocks/operations/mockServer'
import { http, toQuery, unwrap } from './http'

const USE_MOCK = true

const populateSerial = (s) => ({
  ...s,
  product: refs.product(s.product),
  order: refs.order(s.order),
  customer: refs.customer(s.customer),
  installation: refs.installation(s.installation),
  warranty: refs.warranty(s.warranty),
})

// Per product: { product, inStock, reserved, installed, defective, total, reorderLevel, isLowStock }
export async function getStockSummary() {
  if (!USE_MOCK) return http('GET', '/inventory/summary')
  const rows = db.products
    .filter((p) => p.isActive)
    .map((p) => {
      const serials = db.serialItems.filter((s) => s.product === p._id)
      const count = (status) => serials.filter((s) => s.status === status).length
      const inStock = p.trackSerial ? count('in_stock') : p.stockQty
      const reserved = p.trackSerial ? count('reserved') : 0
      const installed = p.trackSerial ? count('installed') : 0
      const defective = p.trackSerial ? count('defective') : 0
      return {
        product: refs.product(p._id),
        inStock,
        reserved,
        installed,
        defective,
        total: inStock + reserved + installed + defective,
        reorderLevel: p.reorderLevel,
        unit: p.unit,
        isLowStock: inStock < p.reorderLevel,
      }
    })
  return unwrap(await respond(rows))
}

// params: { product, status, q }
export async function getSerialItems(params = {}) {
  if (!USE_MOCK) return http('GET', `/serials${toQuery(params)}`)
  let list = db.serialItems
  if (params.product) list = list.filter((s) => s.product === params.product)
  if (params.status) list = list.filter((s) => s.status === params.status)
  if (params.q) list = list.filter((s) => matches(s.serialNumber, params.q))
  return unwrap(await respond(list.map(populateSerial)))
}

// Stock-in: { product, serialNumbers: string[], warehouse } for serial-tracked products,
// or { product, quantity } for untracked ones.
export async function stockIn({ product, serialNumbers = [], quantity, warehouse = 'Main Warehouse - Ludhiana' }) {
  if (!USE_MOCK) return http('POST', '/serials/stock-in', { product, serialNumbers, quantity, warehouse })
  const p = byId('products', product)
  if (!p) return unwrap(await reject('Product not found'))

  if (!p.trackSerial) {
    p.stockQty += Number(quantity) || 0
    return unwrap(await respond({ added: Number(quantity) || 0, duplicates: [] }, 'Stock updated'))
  }

  const cleaned = [...new Set(serialNumbers.map((s) => s.trim().toUpperCase()).filter(Boolean))]
  const existing = new Set(db.serialItems.map((s) => s.serialNumber))
  const duplicates = cleaned.filter((s) => existing.has(s))
  const fresh = cleaned.filter((s) => !existing.has(s))
  fresh.forEach((serialNumber) => {
    db.serialItems.push({
      _id: nextId('ser', db.serialItems),
      serialNumber,
      product,
      status: 'in_stock',
      warehouse,
      order: null,
      customer: null,
      installation: null,
      warranty: null,
      stockInDate: now(),
      notes: '',
      createdAt: now(),
      updatedAt: now(),
    })
  })
  return unwrap(await respond({ added: fresh.length, duplicates }, `${fresh.length} serial(s) added`))
}

// Full trace for one serial: product, status, order, customer, installation, warranty, tickets.
export async function lookupSerial(serialNumber) {
  if (!USE_MOCK) return http('GET', `/serials/lookup/${encodeURIComponent(serialNumber)}`)
  const s = db.serialItems.find((x) => x.serialNumber.toLowerCase() === serialNumber.trim().toLowerCase())
  if (!s) return unwrap(await reject(`No item found with serial ${serialNumber}`))
  const installation = byId('installations', s.installation)
  const warranty = byId('warranties', s.warranty)
  return unwrap(
    await respond({
      ...populateSerial(s),
      installation: installation ? { ...installation, technicians: installation.technicians.map(refs.technician) } : null,
      warranty: warranty ? { ...warranty, status: warrantyStatus(warranty) } : null,
      tickets: db.tickets
        .filter((t) => t.serialItem === s._id)
        .map((t) => ({ _id: t._id, ticketNumber: t.ticketNumber, subject: t.subject, status: t.status, priority: t.priority })),
    }),
  )
}

// ---------- Orders to fulfil ----------

const populateOrder = (o) => ({
  ...o,
  customer: refs.customer(o.customer),
  items: o.items.map((i) => ({ ...i, product: refs.product(i.product) })),
})

// Orders awaiting reservation (status: confirmed) unless another status is passed.
export async function getOrdersToFulfil(params = { status: 'confirmed' }) {
  if (!USE_MOCK) return http('GET', `/orders${toQuery(params)}`)
  let list = db.orders
  if (params.status) list = list.filter((o) => o.status === params.status)
  return unwrap(await respond(list.map(populateOrder)))
}

export async function getOrder(id) {
  if (!USE_MOCK) return http('GET', `/orders/${id}`)
  const o = byId('orders', id)
  return unwrap(await (o ? respond(populateOrder(o)) : reject('Order not found')))
}

// allocations: [{ product: productId, serialItems: [serialItemId, ...] }] for serial-tracked lines.
// Untracked lines are deducted from stockQty automatically.
export async function reserveOrder(orderId, allocations) {
  if (!USE_MOCK) return http('POST', `/orders/${orderId}/reserve`, { allocations })
  const order = byId('orders', orderId)
  if (!order) return unwrap(await reject('Order not found'))
  if (order.status !== 'confirmed') return unwrap(await reject(`Order is ${order.status}, cannot reserve`))

  for (const line of order.items) {
    const p = byId('products', line.product)
    if (p.trackSerial) {
      const alloc = allocations.find((a) => a.product === line.product)
      const ids = alloc?.serialItems ?? []
      if (ids.length !== line.quantity) return unwrap(await reject(`${p.name}: pick ${line.quantity} serial(s), got ${ids.length}`))
      const bad = ids.map((id) => byId('serialItems', id)).find((s) => !s || s.product !== p._id || s.status !== 'in_stock')
      if (bad !== undefined) return unwrap(await reject(`${p.name}: a selected serial is not available`))
    } else if (p.stockQty < line.quantity) {
      return unwrap(await reject(`${p.name}: only ${p.stockQty} ${p.unit} in stock`))
    }
  }

  order.items.forEach((line) => {
    const p = byId('products', line.product)
    if (p.trackSerial) {
      allocations
        .find((a) => a.product === line.product)
        .serialItems.forEach((id) => {
          Object.assign(byId('serialItems', id), { status: 'reserved', order: order._id, customer: order.customer, updatedAt: now() })
        })
    } else {
      p.stockQty -= line.quantity
    }
  })
  order.status = 'reserved'
  return unwrap(await respond(populateOrder(order), 'Inventory reserved'))
}
