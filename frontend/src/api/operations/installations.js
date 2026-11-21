import { db } from '../../mocks/operations/db'
import { byId, nextId, nextNumber, now, refs, reject, respond } from '../../mocks/operations/mockServer'
import { addMonths } from '../../mocks/operations/dates'
import { http, toQuery, unwrap } from './http'

const USE_MOCK = true

export const INSTALLATION_STATUSES = ['scheduled', 'in_progress', 'completed', 'cancelled']

const populate = (i) => ({
  ...i,
  order: refs.order(i.order),
  customer: refs.customer(i.customer),
  technicians: i.technicians.map(refs.technician),
})

const setTechStatus = (ids, status) =>
  ids.forEach((id) => {
    const t = byId('technicians', id)
    if (t) t.status = status
  })

// params: { status, from, to }  (dates as ISO strings)
export async function getInstallations(params = {}) {
  if (!USE_MOCK) return http('GET', `/installations${toQuery(params)}`)
  let list = db.installations
  if (params.status) list = list.filter((i) => i.status === params.status)
  if (params.from) list = list.filter((i) => i.scheduledDate >= params.from)
  if (params.to) list = list.filter((i) => i.scheduledDate <= params.to)
  list = [...list].sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate))
  return unwrap(await respond(list.map(populate)))
}

export async function getInstallation(id) {
  if (!USE_MOCK) return http('GET', `/installations/${id}`)
  const i = byId('installations', id)
  if (!i) return unwrap(await reject('Installation not found'))
  const serials = db.serialItems
    .filter((s) => s.order === i.order)
    .map((s) => ({ _id: s._id, serialNumber: s.serialNumber, status: s.status, product: refs.product(s.product) }))
  return unwrap(await respond({ ...populate(i), serialItems: serials }))
}

// payload: { order, scheduledDate, technicians: [id], notes }
export async function scheduleInstallation(payload) {
  if (!USE_MOCK) return http('POST', '/installations', payload)
  const order = byId('orders', payload.order)
  if (!order) return unwrap(await reject('Order not found'))
  if (order.status !== 'reserved') return unwrap(await reject('Inventory must be reserved before scheduling'))
  if (!payload.technicians?.length) return unwrap(await reject('Assign at least one technician'))
  const customer = byId('customers', order.customer)
  const inst = {
    _id: nextId('ins', db.installations),
    installationNumber: nextNumber('INS', db.installations, 'installationNumber'),
    order: order._id,
    customer: order.customer,
    scheduledDate: payload.scheduledDate,
    technicians: payload.technicians,
    status: 'scheduled',
    siteAddress: customer?.address ?? '',
    systemSizeKw: order.systemSizeKw,
    startedAt: null,
    completedAt: null,
    notes: payload.notes ?? '',
    createdAt: now(),
    updatedAt: now(),
  }
  db.installations.push(inst)
  db.serialItems.filter((s) => s.order === order._id).forEach((s) => (s.installation = inst._id))
  order.status = 'installation_scheduled'
  return unwrap(await respond(populate(inst), 'Installation scheduled'))
}

export async function updateInstallation(id, payload) {
  if (!USE_MOCK) return http('PUT', `/installations/${id}`, payload)
  const inst = byId('installations', id)
  if (!inst) return unwrap(await reject('Installation not found'))
  Object.assign(inst, payload, { updatedAt: now() })
  return unwrap(await respond(populate(inst), 'Installation updated'))
}

// For scheduled -> in_progress (or cancelled). Use completeInstallation() to finish.
export async function setInstallationStatus(id, status) {
  if (!USE_MOCK) return http('PATCH', `/installations/${id}/status`, { status })
  const inst = byId('installations', id)
  if (!inst) return unwrap(await reject('Installation not found'))
  if (status === 'completed') return completeInstallation(id)
  inst.status = status
  if (status === 'in_progress') {
    inst.startedAt = now()
    setTechStatus(inst.technicians, 'on_job')
  }
  if (status === 'cancelled') setTechStatus(inst.technicians, 'available')
  inst.updatedAt = now()
  return unwrap(await respond(populate(inst), 'Status updated'))
}

// Marks complete: serials -> installed, one warranty per serial, order -> installed.
export async function completeInstallation(id, payload = {}) {
  if (!USE_MOCK) return http('POST', `/installations/${id}/complete`, payload)
  const inst = byId('installations', id)
  if (!inst) return unwrap(await reject('Installation not found'))
  if (inst.status === 'completed') return unwrap(await reject('Installation already completed'))

  const completedAt = now()
  Object.assign(inst, { status: 'completed', completedAt, startedAt: inst.startedAt ?? completedAt, notes: payload.notes ?? inst.notes, updatedAt: completedAt })

  const created = []
  db.serialItems
    .filter((s) => s.order === inst.order && s.status === 'reserved')
    .forEach((s) => {
      const product = byId('products', s.product)
      const warranty = {
        _id: nextId('war', db.warranties),
        warrantyNumber: nextNumber('WAR', db.warranties, 'warrantyNumber', 5),
        serialItem: s._id,
        serialNumber: s.serialNumber,
        product: s.product,
        customer: s.customer,
        order: s.order,
        installation: inst._id,
        startDate: completedAt,
        endDate: addMonths(completedAt, product.warrantyMonths),
        status: 'active',
        createdAt: completedAt,
      }
      db.warranties.push(warranty)
      created.push(warranty)
      Object.assign(s, { status: 'installed', installation: inst._id, warranty: warranty._id, updatedAt: completedAt })
    })

  const order = byId('orders', inst.order)
  if (order) order.status = 'installed'
  setTechStatus(inst.technicians, 'available')

  return unwrap(await respond({ installation: populate(inst), warrantiesCreated: created.length }, `Completed - ${created.length} warranties activated`))
}
