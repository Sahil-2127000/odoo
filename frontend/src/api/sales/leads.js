import http, { isGlobalMockEnabled } from './http';
import mockDb from '../../mocks/sales/mockDb';

/**
 * Module-level mock switch
 * Can be overridden per module or globally via localStorage
 */
export let USE_MOCK = true;

export const setUseMock = (useMock) => {
  USE_MOCK = Boolean(useMock);
};

const shouldMock = () => USE_MOCK || isGlobalMockEnabled();

export const getLeads = async (filters = {}) => {
  if (shouldMock()) {
    return Promise.resolve(mockDb.getLeads(filters));
  }
  const query = new URLSearchParams(filters).toString();
  return http.get(`/sales/leads${query ? `?${query}` : ''}`);
};

export const getLeadById = async (id) => {
  if (shouldMock()) {
    return Promise.resolve(mockDb.getLeadById(id));
  }
  return http.get(`/sales/leads/${id}`);
};

export const createLead = async (leadData) => {
  if (shouldMock()) {
    return Promise.resolve(mockDb.createLead(leadData));
  }
  return http.post('/sales/leads', leadData);
};

export const updateLead = async (id, updates) => {
  if (shouldMock()) {
    return Promise.resolve(mockDb.updateLead(id, updates));
  }
  return http.put(`/sales/leads/${id}`, updates);
};

export const updateLeadStatus = async (id, status) => {
  if (shouldMock()) {
    return Promise.resolve(mockDb.updateLeadStatus(id, status));
  }
  return http.patch(`/sales/leads/${id}/status`, { status });
};

export const convertLead = async (id) => {
  if (shouldMock()) {
    return Promise.resolve(mockDb.convertLead(id));
  }
  return http.post(`/sales/leads/${id}/convert`, {});
};

export default {
  USE_MOCK,
  setUseMock,
  getLeads,
  getLeadById,
  createLead,
  updateLead,
  updateLeadStatus,
  convertLead,
};
