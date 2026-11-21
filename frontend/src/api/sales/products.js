import http, { isGlobalMockEnabled } from './http';
import mockDb from '../../mocks/sales/mockDb';

export let USE_MOCK = true;

export const setUseMock = (useMock) => {
  USE_MOCK = Boolean(useMock);
};

const shouldMock = () => USE_MOCK || isGlobalMockEnabled();

export const getProducts = async () => {
  if (shouldMock()) {
    return Promise.resolve(mockDb.getProducts());
  }
  return http.get('/sales/products');
};

export default {
  USE_MOCK,
  setUseMock,
  getProducts,
};
