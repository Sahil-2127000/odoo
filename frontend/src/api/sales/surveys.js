// Site surveys: mock DB, or the survey fields on backend enquiries (/api/v1/enquiries/:id/survey).
import { isGlobalMockEnabled as mock } from './http';
import mockDb from '../../mocks/sales/mockDb';
import * as live from './backend';

export const getSurveys = async (filters = {}) => (mock() ? mockDb.getSurveys(filters) : live.getSurveys(filters));
export const getSurveyById = async (id) => {
  if (mock()) return mockDb.getSurveyById(id);
  const res = await live.getSurveys();
  const survey = res.success ? res.data.find((s) => s.id === id) : null;
  return survey ? { success: true, data: survey, message: 'Survey fetched' } : { success: false, data: null, message: res.message || 'Survey not found' };
};
export const scheduleSurvey = async (data) => (mock() ? mockDb.scheduleSurvey(data) : live.scheduleSurvey(data));
export const completeSurvey = async (id, data) => (mock() ? mockDb.completeSurvey(id, data) : live.completeSurvey(id, data));
export const getSurveysByCustomer = async (customerId) => getSurveys({ customerId });
