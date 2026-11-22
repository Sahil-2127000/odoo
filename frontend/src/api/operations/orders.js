// Warehouse: orders to pack/dispatch, and the installations/warranty views derived from orders.
import api from '@/api/axios'

/** GET /orders?status= */
export const getOrders = (status) => api.get('/orders', { params: status ? { status } : {} })

/** PATCH /orders/:id/status   body: { status, serials? } */
export const advanceStatus = (id, status, serials) =>
  api.patch(`/orders/${id}/status`, serials ? { status, serials } : { status })

/** PATCH /orders/:id/schedule   body: { scheduledDate, assignedTechnician } */
export const scheduleInstallation = (id, data) => api.patch(`/orders/${id}/schedule`, data)

/** GET /orders/warranties */
export const getWarranties = () => api.get('/orders/warranties')

/** GET /auth/users?role=technician */
export const getTechnicians = () => api.get('/auth/users', { params: { role: 'technician' } })
