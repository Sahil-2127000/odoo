// Customers: mock DB or backend /api/v1/customers, chosen by the Sales mode switch.
import { isGlobalMockEnabled as mock } from './http';
import mockDb from '../../mocks/sales/mockDb';
import * as live from './backend';

export const getCustomers = async (filters = {}) => (mock() ? mockDb.getCustomers(filters) : live.getCustomers(filters));
export const getCustomerById = async (id) => (mock() ? mockDb.getCustomerById(id) : live.getCustomerById(id));
export const createCustomer = async (data) => (mock() ? mockDb.createCustomer(data) : live.createCustomer(data));
export const updateCustomer = async (id, updates) => (mock() ? mockDb.updateCustomer(id, updates) : live.updateCustomer(id, updates));
