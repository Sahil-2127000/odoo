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
 * Backend API: POST /enquiries/public  body: { name, phone, city, note, systemType, capacityKw }
 * Returns the saved enquiry, e.g. { code: 'EN-1004', name, phone, ... }
 */
export async function submitEnquiry({ name, phone, city, note, systemType, capacityKw }) {
  return api.post('/enquiries/public', { name, phone, city, note, systemType, capacityKw })
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
 * Online payment, step 1: create a Razorpay order for the amount the customer wants to pay.
 * Backend API: POST /payments/create-order  body: { phone, orderCode, amount (rupees) }
 * Returns { razorpayOrderId, amount (paise), currency, key, orderCode, customerName }
 */
export async function createPayment({ phone, orderCode, amount }) {
  return api.post('/payments/create-order', { phone, orderCode, amount })
}

/**
 * Online payment, step 2: send Razorpay's reply back so the backend checks it and adds the payment.
 * Backend API: POST /payments/verify  body: { razorpay_order_id, razorpay_payment_id, razorpay_signature }
 * Returns { orderCode, paid, pending, paymentId }
 */
export async function verifyPayment(razorpayResponse) {
  return api.post('/payments/verify', razorpayResponse)
}

/**
 * Customer confirms a resolved repair works, which closes the ticket.
 * Backend API: POST /tickets/confirm  body: { phone, code }
 */
export async function confirmTicket({ phone, code }) {
  return api.post('/tickets/confirm', { phone, code: code.trim().toUpperCase() })
}
