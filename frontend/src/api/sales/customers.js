// Customers API — used by two sets of sales pages.
import api from '@/api/axios';
import { isGlobalMockEnabled as mock } from './http';
import mockDb from '../../mocks/sales/mockDb';
import * as live from './backend';

// Dev 3's pages (via customersApi): mock DB or backend /api/v1/customers, chosen by the Sales mode switch.
export const getCustomers = async (filters = {}) => (mock() ? mockDb.getCustomers(filters) : live.getCustomers(filters));
export const getCustomerById = async (id) => (mock() ? mockDb.getCustomerById(id) : live.getCustomerById(id));
export const createCustomer = async (data) => (mock() ? mockDb.createCustomer(data) : live.createCustomer(data));
export const updateCustomer = async (id, updates) => (mock() ? mockDb.updateCustomer(id, updates) : live.updateCustomer(id, updates));

// Rakhi's pages (Customers.jsx, Orders.jsx): direct axios calls.
// Note: the real backend's GET /customers only filters by an exact ?phone=, no partial
// name search - so we fetch the full list and let the DataTable's built-in search box filter it.

/** GET /customers */
export const getCustomerList = () => api.get('/customers');

/** GET /customers/:id -> { customer, orders } */
export const getCustomer = (id) => api.get(`/customers/${id}`);
