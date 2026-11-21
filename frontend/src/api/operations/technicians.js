import { db } from '../../mocks/operations/db'
import { byId, matches, nextId, now, reject, respond } from '../../mocks/operations/mockServer'
import { http, toQuery, unwrap } from './http'

const USE_MOCK = true

export const TECHNICIAN_STATUSES = ['available', 'on_job', 'leave']

// params: { q, status }
export async function getTechnicians(params = {}) {
  if (!USE_MOCK) return http('GET', `/technicians${toQuery(params)}`)
  let list = db.technicians.filter((t) => t.isActive)
  if (params.status) list = list.filter((t) => t.status === params.status)
  if (params.q) list = list.filter((t) => matches(t.name, params.q) || matches(t.phone, params.q))
  return unwrap(await respond(list))
}

export async function createTechnician(payload) {
  if (!USE_MOCK) return http('POST', '/technicians', payload)
  const tech = { status: 'available', skills: [], isActive: true, ...payload, _id: nextId('tec', db.technicians), createdAt: now(), updatedAt: now() }
  db.technicians.push(tech)
  return unwrap(await respond(tech, 'Technician added'))
}

export async function updateTechnician(id, payload) {
  if (!USE_MOCK) return http('PUT', `/technicians/${id}`, payload)
  const t = byId('technicians', id)
  if (!t) return unwrap(await reject('Technician not found'))
  Object.assign(t, payload, { updatedAt: now() })
  return unwrap(await respond(t, 'Technician updated'))
}

export async function setTechnicianStatus(id, status) {
  if (!USE_MOCK) return http('PATCH', `/technicians/${id}/status`, { status })
  if (!TECHNICIAN_STATUSES.includes(status)) return unwrap(await reject('Invalid status'))
  return updateTechnician(id, { status })
}
