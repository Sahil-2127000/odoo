import { db } from '../../mocks/operations/db'
import { byId, matches, nextId, nextNumber, now, refs, reject, respond, warrantyStatus } from '../../mocks/operations/mockServer'
import { http, toQuery, unwrap } from './http'

const USE_MOCK = true

export const TICKET_TYPES = ['complaint', 'service', 'warranty_claim']
export const TICKET_PRIORITIES = ['low', 'medium', 'high', 'urgent']
export const TICKET_STATUSES = ['open', 'assigned', 'in_progress', 'resolved', 'closed']

const populate = (t) => ({
  ...t,
  customer: refs.customer(t.customer),
  order: refs.order(t.order),
  serialItem: refs.serialItem(t.serialItem),
  warranty: refs.warranty(t.warranty),
  assignedTechnician: refs.technician(t.assignedTechnician),
})

// params: { status, priority, type, assignedTechnician, q }
export async function getTickets(params = {}) {
  if (!USE_MOCK) return http('GET', `/tickets${toQuery(params)}`)
  let list = db.tickets
  for (const key of ['status', 'priority', 'type', 'assignedTechnician']) {
    if (params[key]) list = list.filter((t) => t[key] === params[key])
  }
  if (params.q) list = list.filter((t) => matches(t.subject, params.q) || matches(t.ticketNumber, params.q))
  list = [...list].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  return unwrap(await respond(list.map(populate)))
}

export async function getTicket(id) {
  if (!USE_MOCK) return http('GET', `/tickets/${id}`)
  const t = byId('tickets', id)
  return unwrap(await (t ? respond(populate(t)) : reject('Ticket not found')))
}

// payload: { customer, serialItem?, warranty?, type, priority, subject, description }
// isBillable is derived: false when linked warranty is active, otherwise true.
export async function createTicket(payload) {
  if (!USE_MOCK) return http('POST', '/tickets', payload)
  if (!payload.customer) return unwrap(await reject('Customer is required'))
  const serial = payload.serialItem ? byId('serialItems', payload.serialItem) : null
  const warrantyId = payload.warranty ?? serial?.warranty ?? null
  const warranty = warrantyId ? byId('warranties', warrantyId) : null
  const ticket = {
    _id: nextId('tkt', db.tickets),
    ticketNumber: nextNumber('TKT', db.tickets, 'ticketNumber'),
    customer: payload.customer,
    order: serial?.order ?? payload.order ?? null,
    serialItem: serial?._id ?? null,
    warranty: warrantyId,
    type: payload.type ?? 'complaint',
    priority: payload.priority ?? 'medium',
    status: 'open',
    assignedTechnician: null,
    subject: payload.subject ?? '',
    description: payload.description ?? '',
    resolutionNotes: '',
    isBillable: warranty ? warrantyStatus(warranty) !== 'active' : payload.type !== 'warranty_claim',
    resolvedAt: null,
    createdAt: now(),
    updatedAt: now(),
  }
  db.tickets.push(ticket)
  return unwrap(await respond(populate(ticket), `Ticket ${ticket.ticketNumber} created`))
}

export async function updateTicket(id, payload) {
  if (!USE_MOCK) return http('PUT', `/tickets/${id}`, payload)
  const t = byId('tickets', id)
  if (!t) return unwrap(await reject('Ticket not found'))
  Object.assign(t, payload, { updatedAt: now() })
  return unwrap(await respond(populate(t), 'Ticket updated'))
}

export async function assignTicket(id, technicianId) {
  if (!USE_MOCK) return http('PATCH', `/tickets/${id}/assign`, { assignedTechnician: technicianId })
  const t = byId('tickets', id)
  if (!t) return unwrap(await reject('Ticket not found'))
  Object.assign(t, { assignedTechnician: technicianId, status: t.status === 'open' ? 'assigned' : t.status, updatedAt: now() })
  return unwrap(await respond(populate(t), 'Technician assigned'))
}

// resolutionNotes required when moving to resolved / closed.
export async function setTicketStatus(id, status, resolutionNotes) {
  if (!USE_MOCK) return http('PATCH', `/tickets/${id}/status`, { status, resolutionNotes })
  const t = byId('tickets', id)
  if (!t) return unwrap(await reject('Ticket not found'))
  const finishing = status === 'resolved' || status === 'closed'
  if (finishing && !(resolutionNotes || t.resolutionNotes)) return unwrap(await reject('Resolution notes are required'))
  Object.assign(t, {
    status,
    resolutionNotes: resolutionNotes ?? t.resolutionNotes,
    resolvedAt: finishing ? (t.resolvedAt ?? now()) : null,
    updatedAt: now(),
  })
  return unwrap(await respond(populate(t), 'Ticket updated'))
}
