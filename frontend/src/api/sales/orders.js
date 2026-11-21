// Sales: create a quote from a kit, confirm it, and record payments.
import api from '@/api/axios'

/** GET /kits  (to pick one when creating a quote) */
export const getKits = () => api.get('/kits')

/** POST /orders   body: { customer, kit } */
export const createOrder = (data) => api.post('/orders', data)

/** GET /orders?status= */
export const getOrders = (status) => api.get('/orders', { params: status ? { status } : {} })

/** GET /orders/:id */
export const getOrder = (id) => api.get(`/orders/${id}`)

/** PATCH /orders/:id/status   body: { status: "confirmed" } */
export const confirmOrder = (id) => api.patch(`/orders/${id}/status`, { status: 'confirmed' })

/** PATCH /orders/:id/payment   body: { amount } */
export const addPayment = (id, amount) => api.patch(`/orders/${id}/payment`, { amount })
