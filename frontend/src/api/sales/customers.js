import http, { isGlobalMockEnabled } from './http';
import mockDb from '../../mocks/sales/mockDb';

export let USE_MOCK = true;

export const setUseMock = (useMock) => {
  USE_MOCK = Boolean(useMock);
};

const shouldMock = () => USE_MOCK || isGlobalMockEnabled();

export const getCustomers = async (filters = {}) => {
  if (shouldMock()) {
    return Promise.resolve(mockDb.getCustomers(filters));
  }
  const query = new URLSearchParams(filters).toString();
  return http.get(`/sales/customers${query ? `?${query}` : ''}`);
};

export const getCustomerById = async (id) => {
  if (shouldMock()) {
    return Promise.resolve(mockDb.getCustomerById(id));
  }
  return http.get(`/sales/customers/${id}`);
};

export const createCustomer = async (customerData) => {
  if (shouldMock()) {
    return Promise.resolve(mockDb.createCustomer(customerData));
  }
  return http.post('/sales/customers', customerData);
};

export const updateCustomer = async (id, updates) => {
  if (shouldMock()) {
    return Promise.resolve(mockDb.updateCustomer(id, updates));
  }
  return http.put(`/sales/customers/${id}`, updates);
};

export default {
  USE_MOCK,
  setUseMock,
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
};
