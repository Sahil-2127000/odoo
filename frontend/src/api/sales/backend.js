/**
 * Real-backend adapters for the Sales pages.
 *
 * The Express backend (backend/) has a smaller data model than the Sales UI, so every function
 * here maps backend documents into the shapes the pages already use, and returns the same
 * { success, data, message } envelope as the mock DB.
 *
 * Backend model → Sales UI
 *   Enquiry  (EN-xxxx, status new/follow_up/converted/lost, embedded site survey) → Lead + Survey
 *   Customer (CU-xxxx: name, phone, email, address)                                → Customer
 *   Order    (OR-xxxx) with status "quoted"                                        → Quotation
 *   Order    with status confirmed → installed                                     → Order
 *   Order.amountPaid (running total only, no receipt history)                     → Payments
 *
 * Workflow differences enforced by the backend:
 *   - A lead can only be converted after its site survey is approved.
 *   - Quotations are created from a kit (POST /orders { customer, kit }), prices + 18% GST.
 *   - Quotations cannot be edited, marked sent, or rejected; accepting = status "confirmed".
 *   - Payments store only the amount (no mode / reference / per-receipt history).
 */
import api from '@/api/axios'

const GST_RATE = 18

// ---------- helpers ----------

const ok = (data, message = 'OK') => ({ success: true, data, message })
const fail = (message) => ({ success: false, data: null, message })

/** Run an async backend call and convert thrown errors into a { success: false } envelope. */
const run = async (fn, message) => {
  try {
    return ok(await fn(), message)
  } catch (err) {
    return fail(err?.message || 'Request failed')
  }
}

const idOf = (x) => (x && typeof x === 'object' ? x._id || x.id : x) || null
const normPhone = (p) => String(p || '').replace(/\D/g, '').slice(-10)
const cityFromAddress = (address) => {
  const parts = String(address || '').split(',').map((s) => s.trim()).filter(Boolean)
  return parts[parts.length - 1] || ''
}
const includes = (value, q) => String(value || '').toLowerCase().includes(q)

const fetchEnquiries = () => api.get('/enquiries')
const fetchCustomers = () => api.get('/customers')
const fetchOrders = () => api.get('/orders')
const fetchProducts = () => api.get('/products')

const byId = (list) => Object.fromEntries((list || []).map((x) => [String(x._id), x]))

// ---------- products & kits ----------

const panelWatts = (name) => Number(String(name || '').match(/(\d+)\s*W\b/i)?.[1] || 0)

/** Capacity (kW) and on/off-grid from a list of { product, qty }. */
function systemFromLines(lines) {
  const watts = lines.reduce((sum, l) => (l.category === 'panel' ? sum + panelWatts(l.productName) * l.qty : sum), 0)
  const hasBattery = lines.some((l) => l.category === 'battery')
  return {
    systemCapacityKw: watts ? Math.round((watts / 1000) * 100) / 100 : null,
    systemType: hasBattery ? 'off_grid' : 'on_grid',
  }
}

const mapProduct = (p) => ({
  id: p._id,
  _id: p._id,
  name: p.name,
  category: p.category,
  unitPrice: p.sellPrice,
  unit: 'nos',
  stock: p.stock,
  warrantyYears: p.warrantyYears,
})

export const getProducts = () => run(async () => (await fetchProducts()).map(mapProduct), 'Products fetched')

export const getKits = () =>
  run(async () => {
    const kits = await api.get('/kits')
    return kits.map((k) => {
      const items = (k.items || []).map((it) => ({
        productId: idOf(it.product),
        productName: it.product?.name || 'Product',
        category: it.product?.category,
        qty: it.qty,
        unitPrice: it.product?.sellPrice ?? 0,
      }))
      const { systemCapacityKw, systemType } = systemFromLines(items)
      return {
        id: k._id,
        name: k.name,
        capacityKw: systemCapacityKw,
        systemType,
        description: `${items.length} items · priced from today's product list + ${GST_RATE}% GST`,
        items,
        price: k.price,
      }
    })
  }, 'Kits fetched')

// ---------- enquiries → leads ----------

const LEAD_STATUS_FROM_BACKEND = { new: 'new', follow_up: 'contacted', converted: 'converted', lost: 'lost' }

function leadStatus(e) {
  if (e.status === 'converted' || e.status === 'lost') return e.status
  if (e.surveyStatus === 'approved') return 'survey_completed'
  if (e.status === 'follow_up' && e.nextFollowUp) return 'survey_scheduled'
  return LEAD_STATUS_FROM_BACKEND[e.status] || 'new'
}

function mapLead(e, customers = []) {
  const customer = customers.find((c) => normPhone(c.phone) === normPhone(e.phone))
  return {
    id: e._id,
    _id: e._id,
    code: e.code,
    name: e.name,
    phone: e.phone,
    email: customer?.email || '',
    city: e.city || '',
    address: customer?.address || e.city || '',
    source: null,
    monthlyBill: null,
    systemCapacityNeeded: null,
    systemType: null,
    status: leadStatus(e),
    backendStatus: e.status,
    surveyStatus: e.surveyStatus,
    assignedTo: null,
    notes: e.note || '',
    nextFollowUp: e.nextFollowUp || null,
    customerId: e.status === 'converted' ? idOf(customer) : null,
    createdAt: e.createdAt,
    updatedAt: e.updatedAt,
  }
}

export const getLeads = (filters = {}) =>
  run(async () => {
    const [enquiries, customers] = await Promise.all([fetchEnquiries(), fetchCustomers()])
    const q = (filters.search || '').toLowerCase().trim()
    return enquiries
      .map((e) => mapLead(e, customers))
      .filter((l) => !filters.status || filters.status === 'all' || l.status === filters.status)
      .filter((l) => !q || includes(l.name, q) || includes(l.phone, q) || includes(l.city, q) || includes(l.code, q))
  }, 'Leads fetched')

export const getLeadById = async (id) => {
  const res = await getLeads()
  if (!res.success) return res
  const lead = res.data.find((l) => l.id === id)
  return lead ? ok(lead, 'Lead fetched') : fail(`Lead ${id} not found`)
}

export const createLead = (lead) =>
  run(async () => {
    const extras = [
      lead.monthlyBill ? `Monthly bill ₹${Number(lead.monthlyBill).toLocaleString('en-IN')}` : '',
      lead.source ? `via ${lead.source}` : '',
      lead.email || '',
    ].filter(Boolean)
    const note = [lead.notes, extras.length ? `(${extras.join(' · ')})` : ''].filter(Boolean).join(' ')
    const created = await api.post('/enquiries', { name: lead.name, phone: lead.phone, city: lead.city, note })
    return mapLead(created)
  }, 'Lead created')

/** PUT replaces status, note and nextFollowUp together, so always send the current values too. */
async function putEnquiry(id, patch) {
  const current = (await fetchEnquiries()).find((e) => String(e._id) === String(id))
  if (!current) throw new Error('Lead not found')
  return api.put(`/enquiries/${id}`, {
    status: patch.status ?? current.status,
    note: patch.note ?? current.note,
    nextFollowUp: patch.nextFollowUp ?? current.nextFollowUp,
  })
}

const LEAD_STATUS_TO_BACKEND = { new: 'new', contacted: 'follow_up', survey_scheduled: 'follow_up', lost: 'lost' }

export const updateLead = (id, updates) =>
  run(async () => {
    const patch = { note: updates.notes }
    if (updates.status) {
      if (!LEAD_STATUS_TO_BACKEND[updates.status]) throw new Error(`Status "${updates.status}" is set through its own action`)
      patch.status = LEAD_STATUS_TO_BACKEND[updates.status]
    }
    return mapLead(await putEnquiry(id, patch))
  }, 'Lead updated')

export const updateLeadStatus = async (id, status) => {
  if (status === 'survey_completed') return completeSurvey(id, {})
  if (status === 'converted') return convertLead(id)
  return updateLead(id, { status })
}

export const convertLead = (id, details = {}) =>
  run(async () => {
    const customer = await api.post(`/enquiries/${id}/convert`, { email: details.email, address: details.address })
    return mapCustomer(customer)
  }, 'Lead converted to customer')

// ---------- customers ----------

function mapCustomer(c, { orders = [], enquiries = [] } = {}) {
  const custOrders = orders.filter((o) => String(idOf(o.customer)) === String(c._id))
  const enquiry = enquiries.find((e) => normPhone(e.phone) === normPhone(c.phone))
  return {
    id: c._id,
    _id: c._id,
    code: c.code,
    leadId: enquiry?._id || null,
    name: c.name,
    phone: c.phone,
    email: c.email || '',
    address: c.address || '',
    city: enquiry?.city || cityFromAddress(c.address),
    monthlyBill: null,
    notes: enquiry?.note || '',
    surveysCount: enquiry && enquiry.surveyStatus !== 'pending' ? 1 : 0,
    quotesCount: custOrders.filter((o) => o.status === 'quoted').length,
    ordersCount: custOrders.filter((o) => o.status !== 'quoted').length,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
  }
}

export const getCustomers = (filters = {}) =>
  run(async () => {
    const [customers, orders, enquiries] = await Promise.all([fetchCustomers(), fetchOrders(), fetchEnquiries()])
    const q = (filters.search || '').toLowerCase().trim()
    const city = (filters.city && filters.city !== 'all' && filters.city.toLowerCase()) || ''
    return customers
      .map((c) => mapCustomer(c, { orders, enquiries }))
      .filter((c) => !city || c.city.toLowerCase() === city)
      .filter((c) => !q || includes(c.name, q) || includes(c.phone, q) || includes(c.email, q) || includes(c.city, q) || includes(c.code, q))
  }, 'Customers fetched')

export const getCustomerById = (id) =>
  run(async () => {
    const [{ customer }, enquiries, products] = await Promise.all([api.get(`/customers/${id}`), fetchEnquiries(), fetchProducts()])
    // GET /customers/:id returns unpopulated orders; reuse the populated list for names.
    const orders = (await fetchOrders()).filter((o) => String(idOf(o.customer)) === String(id))
    const productsById = byId(products)
    const enquiry = enquiries.find((e) => normPhone(e.phone) === normPhone(customer.phone))
    const base = mapCustomer(customer, { orders, enquiries })
    return {
      ...base,
      lead: enquiry ? { ...mapLead(enquiry, [customer]), source: 'enquiry' } : null,
      surveys: enquiry ? [mapSurvey(enquiry, [customer])] : [],
      quotations: orders.filter((o) => o.status === 'quoted').map((o) => mapQuotation(o, productsById)),
      orders: orders.filter((o) => o.status !== 'quoted').map((o) => mapOrder(o, productsById)),
    }
  }, 'Customer fetched')

export const createCustomer = (data) =>
  run(async () => {
    const address = [data.address, data.city].filter(Boolean).join(', ')
    return mapCustomer(await api.post('/customers', { name: data.name, phone: data.phone, email: data.email, address }))
  }, 'Customer created')

export const updateCustomer = async () => fail('Editing customers is not supported by the backend yet')

// ---------- site surveys (stored on the enquiry) ----------

const SURVEY_STATUS = { approved: 'completed', rejected: 'cancelled' }

/** Survey details are kept human-readable in enquiry.surveyNotes and parsed back here. */
function parseSurveyNotes(text = '') {
  const num = (re) => {
    const m = text.match(re)
    return m ? Number(m[1]) : null
  }
  const [, free = ''] = text.split(' — ')
  return {
    roofType: text.match(/Roof: ([a-z_]+)/)?.[1] || null,
    roofArea: num(/(\d+(?:\.\d+)?) sq ft/),
    shading: text.match(/Shading: ([a-z]+)/)?.[1] || null,
    recommendedKw: num(/Recommended: (\d+(?:\.\d+)?) kW/),
    cableDistance: num(/Cable: (\d+(?:\.\d+)?) m/),
    notes: /Roof: /.test(text) ? free : text,
  }
}

function formatSurveyNotes(d) {
  const facts = [
    d.roofType && `Roof: ${d.roofType}`,
    d.roofArea && `${Number(d.roofArea)} sq ft`,
    d.shading && `Shading: ${d.shading}`,
    d.recommendedKw && `Recommended: ${Number(d.recommendedKw)} kW`,
    d.cableDistance && `Cable: ${Number(d.cableDistance)} m`,
  ].filter(Boolean)
  return [facts.join(' · '), d.notes].filter(Boolean).join(' — ')
}

function mapSurvey(e, customers = []) {
  const customer = customers.find((c) => normPhone(c.phone) === normPhone(e.phone))
  const status = SURVEY_STATUS[e.surveyStatus] || 'scheduled'
  return {
    id: e._id,
    _id: e._id,
    leadId: e._id,
    leadCode: e.code,
    customerId: idOf(customer),
    customerName: e.name,
    customerPhone: e.phone,
    customerCity: e.city || '',
    address: customer?.address || e.city || '',
    scheduledDate: e.nextFollowUp || e.createdAt,
    surveyorId: null,
    surveyorName: 'Site technician',
    status,
    ...parseSurveyNotes(e.surveyNotes || ''),
    completedAt: status === 'completed' ? e.updatedAt : null,
    createdAt: e.createdAt,
  }
}

/** Enquiries that have a survey booked or decided (new/untouched enquiries are not surveys yet). */
const hasSurvey = (e) => e.surveyStatus !== 'pending' || (e.status === 'follow_up' && e.nextFollowUp)

export const getSurveys = (filters = {}) =>
  run(async () => {
    const [enquiries, customers] = await Promise.all([fetchEnquiries(), fetchCustomers()])
    const q = (filters.search || '').toLowerCase().trim()
    return enquiries
      .filter(hasSurvey)
      .map((e) => mapSurvey(e, customers))
      .filter((s) => !filters.status || filters.status === 'all' || s.status === filters.status)
      .filter((s) => !filters.customerId || String(s.customerId) === String(filters.customerId))
      .filter((s) => !q || includes(s.customerName, q) || includes(s.customerPhone, q) || includes(s.customerCity, q))
  }, 'Surveys fetched')

/** Find the enquiry for an id that may be an enquiry id or a customer id (matched by phone). */
async function resolveEnquiry(id) {
  const enquiries = await fetchEnquiries()
  const direct = enquiries.find((e) => String(e._id) === String(id))
  if (direct) return direct
  const customer = (await fetchCustomers()).find((c) => String(c._id) === String(id))
  const match = customer && enquiries.find((e) => normPhone(e.phone) === normPhone(customer.phone))
  if (!match) throw new Error('No enquiry found for this customer. In the backend, site surveys are recorded on the enquiry (lead).')
  return match
}

export const scheduleSurvey = (data) =>
  run(async () => {
    const enquiry = await resolveEnquiry(data.leadId || data.customerId)
    const note = data.notes ? [enquiry.note, `Survey: ${data.notes}`].filter(Boolean).join(' | ') : enquiry.note
    const updated = await api.put(`/enquiries/${enquiry._id}`, {
      status: enquiry.status === 'new' ? 'follow_up' : enquiry.status,
      note,
      nextFollowUp: data.scheduledDate ? new Date(data.scheduledDate).toISOString() : enquiry.nextFollowUp,
    })
    return mapSurvey(updated)
  }, 'Site survey scheduled')

export const completeSurvey = (id, data = {}) =>
  run(async () => {
    const enquiry = await resolveEnquiry(id)
    const updated = await api.patch(`/enquiries/${enquiry._id}/survey`, {
      surveyStatus: 'approved',
      surveyNotes: formatSurveyNotes(data) || enquiry.surveyNotes,
    })
    return mapSurvey(updated)
  }, 'Site survey approved')

export const rejectSurvey = (id, notes) =>
  run(async () => {
    const enquiry = await resolveEnquiry(id)
    return mapSurvey(await api.patch(`/enquiries/${enquiry._id}/survey`, { surveyStatus: 'rejected', surveyNotes: notes }))
  }, 'Site survey rejected, lead marked lost')

// ---------- orders → quotations / orders ----------

const ORDER_STATUS = {
  confirmed: 'confirmed',
  packed: 'inventory_reserved',
  dispatched: 'inventory_reserved',
  delivered: 'installation_scheduled',
  installed: 'completed',
}

function orderLines(o, productsById = {}) {
  return (o.items || []).map((it) => {
    const p = (it.product && typeof it.product === 'object' ? it.product : productsById[String(it.product)]) || {}
    return {
      productId: idOf(it.product),
      productName: p.name || 'Product',
      category: p.category,
      qty: it.qty,
      unitPrice: it.price,
      total: (it.qty || 0) * (it.price || 0),
    }
  })
}

function orderBase(o, productsById) {
  const customer = o.customer && typeof o.customer === 'object' ? o.customer : {}
  const lines = orderLines(o, productsById)
  const subtotal = lines.reduce((s, l) => s + l.total, 0)
  return {
    id: o._id,
    _id: o._id,
    code: o.code,
    customerId: idOf(o.customer),
    customerName: customer.name || '—',
    customerPhone: customer.phone || '',
    customerCity: cityFromAddress(customer.address),
    lines,
    subtotal,
    ...systemFromLines(lines),
    createdAt: o.createdAt,
    updatedAt: o.updatedAt,
  }
}

function mapQuotation(o, productsById) {
  const base = orderBase(o, productsById)
  return {
    ...base,
    quotationNumber: o.code,
    surveyId: null,
    gstRate: GST_RATE,
    gstAmount: Math.round((o.total - base.subtotal) * 100) / 100,
    discount: 0,
    grandTotal: o.total,
    // The backend has no draft/sent/rejected: a quote is open until it is confirmed.
    status: o.status === 'quoted' ? 'sent' : 'accepted',
    notes: '',
  }
}

function mapOrder(o, productsById) {
  const base = orderBase(o, productsById)
  const paid = o.amountPaid || 0
  const balance = Math.max(0, (o.total || 0) - paid)
  return {
    ...base,
    orderNumber: o.code,
    quotationId: o._id,
    quotationNumber: o.code,
    totalAmount: o.total,
    paidAmount: paid,
    balanceAmount: balance,
    status: ORDER_STATUS[o.status] || o.status,
    backendStatus: o.status,
    paymentStatus: balance <= 0 ? 'paid' : paid > 0 ? 'partial' : 'pending',
  }
}

async function loadOrders() {
  const [orders, products] = await Promise.all([fetchOrders(), fetchProducts()])
  return { orders, productsById: byId(products) }
}

export const getQuotations = (filters = {}) =>
  run(async () => {
    const { orders, productsById } = await loadOrders()
    const q = (filters.search || '').toLowerCase().trim()
    return orders
      .map((o) => mapQuotation(o, productsById))
      .filter((x) => !filters.status || filters.status === 'all' || x.status === filters.status)
      .filter((x) => !filters.customerId || String(x.customerId) === String(filters.customerId))
      .filter((x) => !q || includes(x.quotationNumber, q) || includes(x.customerName, q) || includes(x.customerPhone, q))
  }, 'Quotations fetched')

export const getQuotationById = (id) =>
  run(async () => mapQuotation(await api.get(`/orders/${id}`)), 'Quotation fetched')

export const createQuotation = (data) =>
  run(async () => {
    if (!data.kitId) throw new Error('Choose a package: the backend builds quotations from kits.')
    const created = await api.post('/orders', { customer: data.customerId, kit: data.kitId })
    return mapQuotation(await api.get(`/orders/${created._id}`))
  }, 'Quotation created')

export const updateQuotation = async () => fail('Editing or rejecting quotations is not supported by the backend yet')
export const sendQuotation = async () => fail('The backend has no "sent" status: quotations are open until accepted')

export const acceptQuotation = (id) =>
  run(async () => {
    await api.patch(`/orders/${id}/status`, { status: 'confirmed' })
    const order = await api.get(`/orders/${id}`)
    return { quotation: mapQuotation(order), order: mapOrder(order) }
  }, 'Quotation accepted, order confirmed')

export const getOrders = (filters = {}) =>
  run(async () => {
    const { orders, productsById } = await loadOrders()
    return orders
      .filter((o) => o.status !== 'quoted')
      .map((o) => mapOrder(o, productsById))
      .filter((o) => !filters.status || filters.status === 'all' || o.status === filters.status)
      .filter((o) => !filters.paymentStatus || filters.paymentStatus === 'all' || o.paymentStatus === filters.paymentStatus)
      .filter((o) => !filters.customerId || String(o.customerId) === String(filters.customerId))
  }, 'Orders fetched')

/** The backend keeps only a running total, so payments are shown as one "received to date" line per order. */
const paymentSummary = (o) => ({
  id: `paid_${o.id}`,
  orderId: o.id,
  orderNumber: o.orderNumber,
  customerId: o.customerId,
  customerName: o.customerName,
  amount: o.paidAmount,
  mode: null,
  reference: '',
  date: o.updatedAt,
  notes: 'Total received to date',
})

export const getOrderById = (id) =>
  run(async () => {
    const order = mapOrder(await api.get(`/orders/${id}`))
    return { ...order, payments: order.paidAmount > 0 ? [paymentSummary(order)] : [] }
  }, 'Order fetched')

export const getPayments = (filters = {}) =>
  run(async () => {
    const res = await getOrders()
    if (!res.success) throw new Error(res.message)
    return res.data
      .filter((o) => o.paidAmount > 0)
      .filter((o) => !filters.orderId || String(o.id) === String(filters.orderId))
      .map(paymentSummary)
  }, 'Payments fetched')

export const recordPayment = (data) =>
  run(async () => {
    const res = await api.patch(`/orders/${data.orderId}/payment`, { amount: Number(data.amount) })
    const order = mapOrder(await api.get(`/orders/${idOf(res.order) || data.orderId}`))
    return { payment: { ...paymentSummary(order), amount: Number(data.amount) }, order }
  }, 'Payment recorded')

// ---------- dashboard ----------

export const getOverview = () =>
  run(async () => {
    const [enquiries, orders] = await Promise.all([fetchEnquiries(), fetchOrders()])
    const converted = enquiries.filter((e) => e.status === 'converted').length
    const confirmed = orders.filter((o) => o.status !== 'quoted')
    return {
      totalLeads: enquiries.length,
      convertedLeads: converted,
      conversionRate: enquiries.length ? Math.round((converted / enquiries.length) * 100) : 0,
      totalQuotes: orders.length,
      acceptedQuotes: confirmed.length,
      revenueBooked: confirmed.reduce((s, o) => s + (o.total || 0), 0),
      revenueCollected: orders.reduce((s, o) => s + (o.amountPaid || 0), 0),
      pendingSurveys: enquiries.filter((e) => e.surveyStatus === 'pending' && e.status === 'follow_up').length,
      recentLeads: enquiries.slice(0, 5).map((e) => mapLead(e)),
    }
  }, 'Overview fetched')
