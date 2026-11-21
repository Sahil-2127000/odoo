import http, { isGlobalMockEnabled } from './http';
import mockDb from '../../mocks/sales/mockDb';

export let USE_MOCK = true;

export const setUseMock = (useMock) => {
  USE_MOCK = Boolean(useMock);
};

const shouldMock = () => USE_MOCK || isGlobalMockEnabled();

export const getPayments = async (filters = {}) => {
  if (shouldMock()) {
    return Promise.resolve(mockDb.getPayments(filters));
  }
  const query = new URLSearchParams(filters).toString();
  return http.get(`/sales/payments${query ? `?${query}` : ''}`);
};

export const recordPayment = async (paymentData) => {
  if (shouldMock()) {
    return Promise.resolve(mockDb.recordPayment(paymentData));
  }
  return http.post('/sales/payments', paymentData);
};

export const getPaymentsByOrder = async (orderId) => {
  return getPayments({ orderId });
};

export default {
  USE_MOCK,
  setUseMock,
  getPayments,
  recordPayment,
  getPaymentsByOrder,
};
