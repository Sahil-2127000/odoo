// Sales: enquiries (leads) + the site-survey step before they can become a customer.
import api from '@/api/axios'

/** GET /enquiries?status= */
export const getEnquiries = (status) => api.get('/enquiries', { params: status ? { status } : {} })

/** GET /enquiries/follow-ups */
export const getFollowUps = () => api.get('/enquiries/follow-ups')

/** PUT /enquiries/:id   body: { status, note, nextFollowUp } */
export const updateEnquiry = (id, data) => api.put(`/enquiries/${id}`, data)

/** PATCH /enquiries/:id/survey   body: { surveyStatus, surveyNotes } */
export const updateSurvey = (id, data) => api.patch(`/enquiries/${id}/survey`, data)

/** POST /enquiries/:id/convert   body: { address, email } */
export const convertEnquiry = (id, data) => api.post(`/enquiries/${id}/convert`, data)
