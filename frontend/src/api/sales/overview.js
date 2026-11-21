// Sales dashboard KPIs: mock DB, or computed from backend enquiries + orders.
import { isGlobalMockEnabled as mock } from './http';
import mockDb from '../../mocks/sales/mockDb';
import * as live from './backend';

export const getSalesOverview = async () => (mock() ? mockDb.getOverview() : live.getOverview());
