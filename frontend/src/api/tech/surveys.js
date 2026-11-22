// Technician: site surveys sales assigned to me, and recording what I measured on the roof.
import api from '@/api/axios'

/** GET /enquiries/my-surveys  (only pending surveys assigned to the logged-in technician) */
export const getMySurveys = () => api.get('/enquiries/my-surveys')

/** PATCH /enquiries/:id/survey
 *  body: { surveyStatus: 'approved' | 'rejected', surveyDirection, surveyTilt, surveyCableMeters, surveyNotes } */
export const recordSurvey = (id, data) => api.patch(`/enquiries/${id}/survey`, data)
