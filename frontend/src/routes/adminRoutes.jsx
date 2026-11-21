// Owner: Dev 2. Child routes rendered under /admin (inside DashboardLayout).
import { Route } from 'react-router-dom'
import Overview from '@/pages/admin/Overview'
import UiKit from '@/pages/admin/UiKit'
import ComingSoon from '@/pages/common/ComingSoon'

const adminRoutes = (
  <>
    <Route index element={<Overview />} />
    <Route path="projects" element={<ComingSoon title="Projects" />} />
    <Route path="projects/:id" element={<ComingSoon title="Project detail" />} />
    <Route path="analytics" element={<ComingSoon title="Financial analytics" />} />
    <Route path="team" element={<ComingSoon title="Team" />} />
    <Route path="reports" element={<ComingSoon title="Reports" />} />
    <Route path="ui-kit" element={<UiKit />} />
  </>
)

export default adminRoutes
