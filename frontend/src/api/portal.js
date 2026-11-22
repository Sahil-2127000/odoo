// Customer portal API. The backend only ever returns the logged-in customer's own data.
import api from './axios'

/** GET /portal/summary -> { enquiries, orders (items have warrantyEnd), tickets } */
export const getPortalSummary = () => api.get('/portal/summary')

/** GET /portal/orders/:id -> one of my orders (used for the invoice) */
export const getMyOrder = (id) => api.get(`/portal/orders/${id}`)

/** POST /portal/tickets   body: { orderId, issue } */
export const raiseComplaint = (orderId, issue) => api.post('/portal/tickets', { orderId, issue })

/** PATCH /portal/tickets/:id/confirm   (the repair works, close the ticket) */
export const confirmFix = (id) => api.patch(`/portal/tickets/${id}/confirm`)
