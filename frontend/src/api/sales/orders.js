import http, { isGlobalMockEnabled } from './http';
import mockDb from '../../mocks/sales/mockDb';

export let USE_MOCK = true;

export const setUseMock = (useMock) => {
  USE_MOCK = Boolean(useMock);
};

const shouldMock = () => USE_MOCK || isGlobalMockEnabled();

export const getOrders = async (filters = {}) => {
  if (shouldMock()) {
    return Promise.resolve(mockDb.getOrders(filters));
  }
  const query = new URLSearchParams(filters).toString();
  return http.get(`/sales/orders${query ? `?${query}` : ''}`);
};

export const getOrderById = async (id) => {
  if (shouldMock()) {
    return Promise.resolve(mockDb.getOrderById(id));
  }
  return http.get(`/sales/orders/${id}`);
};

export default {
  USE_MOCK,
  setUseMock,
  getOrders,
  getOrderById,
};
