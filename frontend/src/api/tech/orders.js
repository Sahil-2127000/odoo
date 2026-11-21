// Technician: installations to do, and marking one installed with a photo.
import api from '@/api/axios'

/**
 * GET /orders?status=delivered
 * Note: this isn't filtered to the logged-in technician by the backend (unlike tickets),
 * so the page filters the result to order.assignedTechnician._id === the current user.
 */
export const getDeliveredOrders = () => api.get('/orders', { params: { status: 'delivered' } })

/** PATCH /orders/:id/status   body: { status: "installed", photo: "data:image/...;base64,..." } */
export const markInstalled = (id, photo) => api.patch(`/orders/${id}/status`, { status: 'installed', photo })
