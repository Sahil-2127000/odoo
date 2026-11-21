// Sales: customer list + detail (with their order history).
// Note: the real backend's GET /customers only filters by an exact ?phone=, no partial
// name search - so we fetch the full list and let the DataTable's built-in search box filter it.
import api from '@/api/axios'

/** GET /customers */
export const getCustomers = () => api.get('/customers')

/** GET /customers/:id -> { customer, orders } */
export const getCustomer = (id) => api.get(`/customers/${id}`)
