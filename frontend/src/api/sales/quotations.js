// Quotations: mock DB, or backend orders with status "quoted" (/api/v1/orders).
import { isGlobalMockEnabled as mock } from './http';
import mockDb from '../../mocks/sales/mockDb';
import * as live from './backend';

export const getQuotations = async (filters = {}) => (mock() ? mockDb.getQuotations(filters) : live.getQuotations(filters));
export const getQuotationById = async (id) => (mock() ? mockDb.getQuotationById(id) : live.getQuotationById(id));
export const createQuotation = async (data) => (mock() ? mockDb.createQuotation(data) : live.createQuotation(data));
export const updateQuotation = async (id, updates) => (mock() ? mockDb.updateQuotation(id, updates) : live.updateQuotation(id, updates));
export const sendQuotation = async (id) => (mock() ? mockDb.sendQuotation(id) : live.sendQuotation(id));
export const acceptQuotation = async (id) => (mock() ? mockDb.acceptQuotation(id) : live.acceptQuotation(id));
