import http, { isGlobalMockEnabled } from './http';
import mockDb from '../../mocks/sales/mockDb';

export let USE_MOCK = true;

export const setUseMock = (useMock) => {
  USE_MOCK = Boolean(useMock);
};

const shouldMock = () => USE_MOCK || isGlobalMockEnabled();

export const getSalesOverview = async () => {
  if (shouldMock()) {
    return Promise.resolve(mockDb.getOverview());
  }
  return http.get('/sales/overview');
};

export default {
  USE_MOCK,
  setUseMock,
  getSalesOverview,
};
