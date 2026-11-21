// Leads: mock DB or backend enquiries (/api/v1/enquiries), chosen by the Sales mode switch.
import { isGlobalMockEnabled as mock } from './http';
import mockDb from '../../mocks/sales/mockDb';
import * as live from './backend';

export const getLeads = async (filters = {}) => (mock() ? mockDb.getLeads(filters) : live.getLeads(filters));
export const getLeadById = async (id) => (mock() ? mockDb.getLeadById(id) : live.getLeadById(id));
export const createLead = async (data) => (mock() ? mockDb.createLead(data) : live.createLead(data));
export const updateLead = async (id, updates) => (mock() ? mockDb.updateLead(id, updates) : live.updateLead(id, updates));
export const updateLeadStatus = async (id, status) =>
  mock() ? mockDb.updateLeadStatus(id, status) : live.updateLeadStatus(id, status);
export const convertLead = async (id, details) => (mock() ? mockDb.convertLead(id) : live.convertLead(id, details));
