// Sales: complaints list + assigning a technician.
import api from '@/api/axios'

/** GET /tickets?status= */
export const getTickets = (status) => api.get('/tickets', { params: status ? { status } : {} })

/** GET /auth/users?role=technician */
export const getTechnicians = () => api.get('/auth/users', { params: { role: 'technician' } })

/** PATCH /tickets/:id   body: { assignedTo: "<technician id>" } */
export const assignTicket = (id, technicianId) => api.patch(`/tickets/${id}`, { assignedTo: technicianId })
