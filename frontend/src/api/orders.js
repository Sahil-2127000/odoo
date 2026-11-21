// Orders API for the admin Orders page. Real backend.
import api from './axios'

/**
 * All orders, or only one status.
 * Backend API: GET /orders?status=   (customer populated: code, name, phone, address)
 */
export async function getOrders(status = '') {
  return api.get('/orders', { params: status ? { status } : {} })
}

/**
 * One order with full details.
 * Backend API: GET /orders/:id   (customer + items.product populated: name, category, warrantyYears)
 */
export async function getOrderById(id) {
  return api.get(`/orders/${id}`)
}
