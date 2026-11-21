// Helpers that make mock calls behave like the real Express API:
// async, small latency, and the same { success, data, message } envelope.
import { db } from './db'

const LATENCY_MS = 250

export const respond = (data, message = 'OK') =>
  new Promise((resolve) => setTimeout(() => resolve({ success: true, data: structuredClone(data), message }), LATENCY_MS))

export const reject = (message) =>
  new Promise((resolve) => setTimeout(() => resolve({ success: false, data: null, message }), LATENCY_MS))

export const now = () => new Date().toISOString()

export const nextId = (prefix, collection) => {
  const max = collection.reduce((m, doc) => Math.max(m, Number(doc._id.split('_')[1]) || 0), 0)
  return `${prefix}_${String(max + 1).padStart(3, '0')}`
}

export const nextNumber = (prefix, collection, field, width = 4) => {
  const max = collection.reduce((m, doc) => Math.max(m, Number(String(doc[field]).split('-').pop()) || 0), 0)
  return `${prefix}-${String(max + 1).padStart(width, '0')}`
}

export const byId = (collection, id) => db[collection].find((d) => d._id === id) ?? null

export const matches = (value, q) => String(value ?? '').toLowerCase().includes(String(q).toLowerCase())

export const warrantyStatus = (w) => (new Date(w.endDate) > new Date() ? 'active' : 'expired')

// ---- populate(), mirroring what the real API should return ----
// Refs are replaced by small objects so pages can render without extra calls.
const pick = (doc, fields) => (doc ? Object.fromEntries(fields.map((f) => [f, doc[f]])) : null)

export const refs = {
  product: (id) => pick(byId('products', id), ['_id', 'name', 'sku', 'category', 'brand', 'warrantyMonths', 'trackSerial']),
  customer: (id) => pick(byId('customers', id), ['_id', 'name', 'phone', 'address']),
  order: (id) => pick(byId('orders', id), ['_id', 'orderNumber', 'status', 'systemType', 'systemSizeKw']),
  technician: (id) => pick(byId('technicians', id), ['_id', 'name', 'phone', 'status']),
  installation: (id) => pick(byId('installations', id), ['_id', 'installationNumber', 'status', 'scheduledDate', 'completedAt']),
  serialItem: (id) => pick(byId('serialItems', id), ['_id', 'serialNumber', 'status']),
  warranty: (id) => {
    const w = byId('warranties', id)
    return w ? { ...pick(w, ['_id', 'warrantyNumber', 'startDate', 'endDate']), status: warrantyStatus(w) } : null
  },
}
