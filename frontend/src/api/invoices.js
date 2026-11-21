// Invoices API: orders (product sales) and repair bills (out-of-warranty tickets).
import api, { mockDelay } from './axios'
import { mockOrders, mockRepairBills } from '@/mocks/invoices'

export const USE_MOCK = true // Set to false when the backend endpoints are ready

/**
 * All orders, optionally only one status.
 * Backend API: GET /orders?status=
 */
export async function getOrders(status = '') {
  if (USE_MOCK) return mockDelay(status ? mockOrders.filter((o) => o.status === status) : mockOrders)
  return api.get('/orders', { params: status ? { status } : {} })
}

/**
 * Tickets that were billed to the customer (repair outside warranty).
 * Backend API: GET /tickets?billed=true
 */
export async function getRepairBills() {
  if (USE_MOCK) return mockDelay(mockRepairBills)
  return api.get('/tickets', { params: { billed: true } })
}

/**
 * One invoice, for the printable invoice page.
 * type is 'order' or 'repair'.
 * Backend API: GET /orders/:id (repair bills are taken from the billed tickets list)
 */
export async function getInvoice(type, id) {
  if (type === 'order') {
    if (USE_MOCK) return mockDelay(mockOrders.find((o) => o._id === id) ?? null)
    return api.get(`/orders/${id}`)
  }
  const bills = await getRepairBills()
  return bills.find((t) => t._id === id) ?? null
}
