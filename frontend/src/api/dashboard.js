// Admin dashboard API (real backend).
import api from './axios'

/**
 * KPI numbers for the admin.
 * Backend API: GET /dashboard/admin
 * Returns {
 *   revenue: { today, week, month, total }, collected, pendingPayments, profit,
 *   counts: { newEnquiries, pendingQuotes, unfinishedInstalls, installedOrders, openTickets, lowStockCount },
 *   recentOrders: [...]
 * }
 * (revenue does not count "quoted" orders)
 */
export async function getAdminDashboard() {
  return api.get('/dashboard/admin')
}

/**
 * The backend has no chart endpoints, so the charts are worked out in the browser
 * from these three lists.
 */
export async function getOrders() {
  return api.get('/orders') // customer populated: code, name, phone, address
}

export async function getEnquiries() {
  return api.get('/enquiries')
}

export async function getTickets() {
  return api.get('/tickets') // customer, order and assignedTo populated
}
