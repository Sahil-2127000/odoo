// Invoices API: orders (product sales) and repair bills (tickets outside warranty). Real backend.
import api from './axios'

/**
 * All orders, optionally only one status.
 * Backend API: GET /orders?status=   (customer populated: code, name, phone, address)
 */
export async function getOrders(status = '') {
  return api.get('/orders', { params: status ? { status } : {} })
}

/**
 * Repair bills = tickets with a charge (billAmount > 0, i.e. not covered by warranty).
 * Backend API: GET /tickets   (there is no "billed" filter, so we filter here)
 */
export async function getRepairBills() {
  const tickets = await api.get('/tickets')
  return tickets.filter((t) => t.billAmount > 0)
}

/**
 * One invoice, for the printable invoice page. type is 'order' or 'repair'.
 * Backend API: GET /orders/:id (customer and items.product populated).
 * Repair bills have no single-ticket endpoint, so we pick it from the list.
 */
export async function getInvoice(type, id) {
  if (type === 'order') return api.get(`/orders/${id}`)
  const bills = await getRepairBills()
  return bills.find((t) => t._id === id) ?? null
}
