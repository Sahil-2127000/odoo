// Orders: mock DB, or backend orders past "quoted" (/api/v1/orders).
import { isGlobalMockEnabled as mock } from './http';
import mockDb from '../../mocks/sales/mockDb';
import * as live from './backend';

export const getOrders = async (filters = {}) => (mock() ? mockDb.getOrders(filters) : live.getOrders(filters));
export const getOrderById = async (id) => (mock() ? mockDb.getOrderById(id) : live.getOrderById(id));
