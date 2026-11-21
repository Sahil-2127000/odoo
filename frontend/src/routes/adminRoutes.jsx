// Pages under /admin (shown inside DashboardLayout). Owner: Frontend 1.
import { Route } from 'react-router-dom'
import Overview from '@/pages/admin/Overview'
import UiKit from '@/pages/admin/UiKit'
import ComingSoon from '@/pages/common/ComingSoon'

const adminRoutes = (
  <>
    <Route index element={<Overview />} />
    <Route path="products" element={<ComingSoon title="Products" />} />
    <Route path="kits" element={<ComingSoon title="Kits" />} />
    <Route path="users" element={<ComingSoon title="Users" />} />
    <Route path="invoices" element={<ComingSoon title="Invoices" />} />
    {/* Live preview of all shared components, for teammates */}
    <Route path="ui-kit" element={<UiKit />} />
  </>
)

export default adminRoutes
