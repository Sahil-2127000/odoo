import { db } from '../../mocks/operations/db'
import { matches, refs, reject, respond, warrantyStatus } from '../../mocks/operations/mockServer'
import { http, toQuery, unwrap } from './http'

const USE_MOCK = true

const populate = (w) => ({
  ...w,
  status: warrantyStatus(w),
  product: refs.product(w.product),
  customer: refs.customer(w.customer),
  order: refs.order(w.order),
})

// params: { status: 'active' | 'expired', q (serial / customer name), customer }
export async function getWarranties(params = {}) {
  if (!USE_MOCK) return http('GET', `/warranties${toQuery(params)}`)
  let list = db.warranties.map(populate)
  if (params.status) list = list.filter((w) => w.status === params.status)
  if (params.customer) list = list.filter((w) => w.customer?._id === params.customer)
  if (params.q) list = list.filter((w) => matches(w.serialNumber, params.q) || matches(w.customer?.name, params.q))
  return unwrap(await respond(list))
}

export async function getWarrantyBySerial(serialNumber) {
  if (!USE_MOCK) return http('GET', `/warranties/serial/${encodeURIComponent(serialNumber)}`)
  const w = db.warranties.find((x) => x.serialNumber.toLowerCase() === serialNumber.trim().toLowerCase())
  return unwrap(await (w ? respond(populate(w)) : reject(`No warranty found for ${serialNumber}`)))
}
