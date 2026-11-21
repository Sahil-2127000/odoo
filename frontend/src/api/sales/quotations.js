import http, { isGlobalMockEnabled } from './http';
import mockDb from '../../mocks/sales/mockDb';

export let USE_MOCK = true;

export const setUseMock = (useMock) => {
  USE_MOCK = Boolean(useMock);
};

const shouldMock = () => USE_MOCK || isGlobalMockEnabled();

export const getQuotations = async (filters = {}) => {
  if (shouldMock()) {
    return Promise.resolve(mockDb.getQuotations(filters));
  }
  const query = new URLSearchParams(filters).toString();
  return http.get(`/sales/quotations${query ? `?${query}` : ''}`);
};

export const getQuotationById = async (id) => {
  if (shouldMock()) {
    return Promise.resolve(mockDb.getQuotationById(id));
  }
  return http.get(`/sales/quotations/${id}`);
};

export const createQuotation = async (quoteData) => {
  if (shouldMock()) {
    return Promise.resolve(mockDb.createQuotation(quoteData));
  }
  return http.post('/sales/quotations', quoteData);
};

export const updateQuotation = async (id, updates) => {
  if (shouldMock()) {
    return Promise.resolve(mockDb.updateQuotation(id, updates));
  }
  return http.put(`/sales/quotations/${id}`, updates);
};

export const sendQuotation = async (id) => {
  if (shouldMock()) {
    return Promise.resolve(mockDb.sendQuotation(id));
  }
  return http.patch(`/sales/quotations/${id}/send`, {});
};

export const acceptQuotation = async (id) => {
  if (shouldMock()) {
    return Promise.resolve(mockDb.acceptQuotation(id));
  }
  return http.post(`/sales/quotations/${id}/accept`, {});
};

export default {
  USE_MOCK,
  setUseMock,
  getQuotations,
  getQuotationById,
  createQuotation,
  updateQuotation,
  sendQuotation,
  acceptQuotation,
};
