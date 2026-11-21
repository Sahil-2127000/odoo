// Pages under /tech (shown inside TechLayout, the mobile layout). Owner: Frontend 3.
// Replace the ComingSoon placeholders with your pages from src/pages/tech/.
import { Route } from 'react-router-dom'
import ComingSoon from '@/pages/common/ComingSoon'

const techRoutes = (
  <>
    <Route index element={<ComingSoon title="My jobs today" />} />
    <Route path="jobs/:id" element={<ComingSoon title="Job details" />} />
    <Route path="tickets/:id" element={<ComingSoon title="Repair ticket" />} />
  </>
)

export default techRoutes
