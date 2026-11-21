import api, { mockDelay } from './axios'
import { mockKits, mockOrdersDatabase } from '@/mocks/public'

export const USE_MOCK = true // Set to false when backend endpoints are ready

// Store in-memory changes during session
let ordersStore = structuredClone(mockOrdersDatabase)
let ticketCounter = 208

/**
 * Fetch available solar packages / kits
 * Backend API: GET /public/kits
 */
export async function getPublicKits() {
  if (USE_MOCK) {
    return mockDelay(mockKits, 200)
  }
  return api.get('/public/kits')
}

/**
 * Submit a customer lead enquiry from the landing page
 * Backend API: POST /public/enquiry
 */
export async function submitEnquiry(payload) {
  if (USE_MOCK) {
    await mockDelay(null, 400)
    const refNumber = `REF-${Math.floor(1000 + Math.random() * 9000)}`
    
    // Save to localStorage so other dashboards (Sales) can see it if needed
    try {
      const existing = JSON.parse(localStorage.getItem('sunpower_mock_leads') || '[]')
      existing.unshift({
        id: crypto.randomUUID(),
        refNumber,
        ...payload,
        status: 'new',
        createdAt: new Date().toISOString(),
      })
      localStorage.setItem('sunpower_mock_leads', JSON.stringify(existing))
    } catch {
      // ignore
    }

    return {
      referenceNumber: refNumber,
      message: 'Enquiry received successfully! Our solar expert will call you shortly.',
    }
  }
  return api.post('/public/enquiry', payload)
}

/**
 * Look up order status and equipment details by phone & order ID
 * Backend API: POST /public/track
 */
export async function trackOrder({ phone, orderId }) {
  if (USE_MOCK) {
    await mockDelay(null, 300)
    const cleanPhone = String(phone || '').trim().replace(/\D/g, '')
    const cleanOrderId = String(orderId || '').trim().toUpperCase()

    const order = ordersStore.find(
      (o) =>
        o.orderId.toUpperCase() === cleanOrderId &&
        o.phone.replace(/\D/g, '') === cleanPhone,
    )

    if (!order) {
      throw new Error('No order found matching this Phone Number and Order ID. Please verify your details.')
    }

    return structuredClone(order)
  }
  return api.post('/public/track', { phone, orderId })
}

/**
 * Customer reports an equipment issue / complaint
 * Backend API: POST /public/tickets
 */
export async function reportProblem(payload) {
  if (USE_MOCK) {
    await mockDelay(null, 400)
    const ticketNo = `TK-${ticketCounter++}`
    const newTicket = {
      id: `t-${ticketCounter}`,
      ticketNo,
      serialUnitId: payload.serialUnitId,
      issue: payload.description || payload.issueType,
      issueType: payload.issueType,
      faultCode: payload.faultCode || null,
      status: 'open',
      createdAt: new Date().toISOString().slice(0, 10),
    }

    // Attach to the corresponding order in ordersStore
    const order = ordersStore.find((o) => o.orderId === payload.orderId)
    if (order) {
      order.tickets = [newTicket, ...(order.tickets || [])]
    }

    return { ticketNo, status: 'open' }
  }
  return api.post('/public/tickets', payload)
}

/**
 * Customer confirms that resolved ticket issue is fixed
 * Backend API: PATCH /public/tickets/:id/confirm
 */
export async function confirmTicket(ticketId) {
  if (USE_MOCK) {
    await mockDelay(null, 250)
    for (const order of ordersStore) {
      const ticket = order.tickets?.find((t) => t.id === ticketId || t.ticketNo === ticketId)
      if (ticket) {
        ticket.status = 'confirmed'
        return { success: true, status: 'confirmed' }
      }
    }
    return { success: true, status: 'confirmed' }
  }
  return api.patch(`/public/tickets/${ticketId}/confirm`)
}
