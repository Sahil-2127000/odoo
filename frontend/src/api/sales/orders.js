// Orders API — used by two sets of sales pages.
import api from '@/api/axios';
import { isGlobalMockEnabled as mock } from './http';
import mockDb from '../../mocks/sales/mockDb';
import * as live from './backend';

// Dev 3's pages (via ordersApi): mock DB, or backend orders past "quoted" (/api/v1/orders).
export const getOrders = async (filters = {}) => (mock() ? mockDb.getOrders(filters) : live.getOrders(filters));
export const getOrderById = async (id) => (mock() ? mockDb.getOrderById(id) : live.getOrderById(id));

// Rakhi's pages (Orders.jsx): create a quote from a kit, confirm it, and record payments.

/** GET /kits  (to pick one when creating a quote) */
export const getKits = () => api.get('/kits');

/** POST /orders   body: { customer, kit } */
export const createOrder = (data) => api.post('/orders', data);

/** GET /orders?status= */
export const getOrdersByStatus = (status) => api.get('/orders', { params: status ? { status } : {} });

/** GET /orders/:id */
export const getOrder = (id) => api.get(`/orders/${id}`);

/** PATCH /orders/:id/status   body: { status: "confirmed" } */
export const confirmOrder = (id) => api.patch(`/orders/${id}/status`, { status: 'confirmed' });

/** PATCH /orders/:id/payment   body: { amount } */
export const addPayment = (id, amount) => api.patch(`/orders/${id}/payment`, { amount });
