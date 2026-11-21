// Product catalogue: mock DB, or backend /api/v1/products (sellPrice → unitPrice).
import { isGlobalMockEnabled as mock } from './http';
import mockDb from '../../mocks/sales/mockDb';
import * as live from './backend';

export const getProducts = async () => (mock() ? mockDb.getProducts() : live.getProducts());
