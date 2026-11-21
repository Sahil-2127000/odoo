// Pages under /tech (shown inside TechLayout, the mobile layout). Owner: Technician (Rakhi).
import { Route } from 'react-router-dom'
import MyInstallations from '@/pages/tech/MyInstallations'
import MyComplaints from '@/pages/tech/MyComplaints'

const techRoutes = (
  <>
    <Route index element={<MyInstallations />} />
    <Route path="complaints" element={<MyComplaints />} />
  </>
)

export default techRoutes
