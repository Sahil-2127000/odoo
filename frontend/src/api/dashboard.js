// Admin dashboard API. Works on fake data until the backend is ready.
import api, { mockDelay } from './axios'
import { mockFunnel, mockProfitPerJob, mockSummary } from '@/mocks/dashboard'

export const USE_MOCK = true // Set to false when the backend endpoints are ready

/**
 * KPI numbers, revenue chart, unfinished jobs and old tickets for a time range.
 * Backend API: GET /dashboard/summary?range=today|week|month
 */
export async function getDashboardSummary(range = 'today') {
  if (USE_MOCK) return mockDelay(mockSummary[range])
  return api.get('/dashboard/summary', { params: { range } })
}

/**
 * Sale, costs and profit for each finished job.
 * Backend API: GET /dashboard/profit-per-job
 */
export async function getProfitPerJob() {
  if (USE_MOCK) return mockDelay(mockProfitPerJob)
  return api.get('/dashboard/profit-per-job')
}

/**
 * Number of leads at each stage, from new to won.
 * Backend API: GET /dashboard/funnel
 */
export async function getFunnel() {
  if (USE_MOCK) return mockDelay(mockFunnel)
  return api.get('/dashboard/funnel')
}
