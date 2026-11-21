// Payments: mock DB receipts, or backend order payments (PATCH /api/v1/orders/:id/payment).
import { isGlobalMockEnabled as mock } from './http';
import mockDb from '../../mocks/sales/mockDb';
import * as live from './backend';

export const getPayments = async (filters = {}) => (mock() ? mockDb.getPayments(filters) : live.getPayments(filters));
export const recordPayment = async (data) => (mock() ? mockDb.recordPayment(data) : live.recordPayment(data));
export const getPaymentsByOrder = async (orderId) => getPayments({ orderId });
