// Package kits for the quotation builder: mock templates, or backend /api/v1/kits.
import { isGlobalMockEnabled as mock } from './http';
import { mockKitTemplates } from '../../mocks/sales/kitTemplates';
import * as live from './backend';

export const getKits = async () =>
  mock() ? { success: true, data: mockKitTemplates, message: 'Kits fetched' } : live.getKits();
