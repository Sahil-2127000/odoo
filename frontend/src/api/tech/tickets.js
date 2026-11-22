// Technician: complaints assigned to me.
import api from '@/api/axios'

/** GET /tickets  (backend already returns only tickets assigned to the logged-in technician) */
export const getMyTickets = () => api.get('/tickets')

/** PATCH /tickets/:id   body: { status: "resolved" } */
export const resolveTicket = (id) => api.patch(`/tickets/${id}`, { status: 'resolved' })
