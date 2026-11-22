// Pages under /tech (shown inside TechLayout, the mobile layout). Owner: Technician (Rakhi).
import { Route } from 'react-router-dom'
import MyInstallations from '@/pages/tech/MyInstallations'
import MyComplaints from '@/pages/tech/MyComplaints'
import MySurveys from '@/pages/tech/MySurveys'

const techRoutes = (
  <>
    <Route index element={<MyInstallations />} />
    <Route path="surveys" element={<MySurveys />} />
    <Route path="complaints" element={<MyComplaints />} />
  </>
)

export default techRoutes
