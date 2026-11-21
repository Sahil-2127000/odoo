import http, { isGlobalMockEnabled } from './http';
import mockDb from '../../mocks/sales/mockDb';

export let USE_MOCK = true;

export const setUseMock = (useMock) => {
  USE_MOCK = Boolean(useMock);
};

const shouldMock = () => USE_MOCK || isGlobalMockEnabled();

export const getSurveys = async (filters = {}) => {
  if (shouldMock()) {
    return Promise.resolve(mockDb.getSurveys(filters));
  }
  const query = new URLSearchParams(filters).toString();
  return http.get(`/sales/surveys${query ? `?${query}` : ''}`);
};

export const getSurveyById = async (id) => {
  if (shouldMock()) {
    return Promise.resolve(mockDb.getSurveyById(id));
  }
  return http.get(`/sales/surveys/${id}`);
};

export const scheduleSurvey = async (surveyData) => {
  if (shouldMock()) {
    return Promise.resolve(mockDb.scheduleSurvey(surveyData));
  }
  return http.post('/sales/surveys', surveyData);
};

export const completeSurvey = async (id, completionData) => {
  if (shouldMock()) {
    return Promise.resolve(mockDb.completeSurvey(id, completionData));
  }
  return http.patch(`/sales/surveys/${id}/complete`, completionData);
};

export const getSurveysByCustomer = async (customerId) => {
  return getSurveys({ customerId });
};

export default {
  USE_MOCK,
  setUseMock,
  getSurveys,
  getSurveyById,
  scheduleSurvey,
  completeSurvey,
  getSurveysByCustomer,
};
