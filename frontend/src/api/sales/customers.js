import api from '@/api/axios'

/** GET /customers */
export const getCustomers = () => api.get('/customers')

/** GET /customers/:id -> { customer, orders } */
export const getCustomer = (id) => api.get(`/customers/${id}`)
