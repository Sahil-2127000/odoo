// Public API: used by the landing page and Track my order. No login needed.
import api, { mockDelay } from './axios'
import { mockKits } from '@/mocks/public'

/**
 * Solar packages for the landing page.
 * The backend only has GET /kits for logged-in staff, so the packages are kept in the frontend.
 */
export async function getPublicKits() {
  return mockDelay(mockKits, 200)
}

/**
 * Landing page "Get a free quote" form.
 * Backend API: POST /enquiries/public  body: { name, phone, city, note }
 * Returns the saved enquiry, e.g. { code: 'EN-1004', name, phone, ... }
 */
export async function submitEnquiry({ name, phone, city, note }) {
  return api.post('/enquiries/public', { name, phone, city, note })
}

/**
 * Track my order: the phone number must match the order's customer.
 * Backend API: GET /orders/track?phone=&code=
 * Returns { code, customerName, status, installedAt, items: [{ name, qty, warrantyYears, warrantyEnd }] }
 */
export async function trackOrder({ phone, code }) {
  return api.get('/orders/track', { params: { phone: phone.trim(), code: code.trim().toUpperCase() } })
}

/**
 * Report a problem (only allowed after installation).
 * Backend API: POST /tickets/public  body: { phone, orderCode, issue }
 * Returns the ticket: { code: 'TK-1002', status: 'open', underWarranty, billAmount, ... }
 */
export async function reportProblem({ phone, orderCode, issue }) {
  return api.post('/tickets/public', { phone, orderCode, issue })
}

/**
 * Customer confirms a resolved repair works, which closes the ticket.
 * Backend API: POST /tickets/confirm  body: { phone, code }
 */
export async function confirmTicket({ phone, code }) {
  return api.post('/tickets/confirm', { phone, code: code.trim().toUpperCase() })
}
