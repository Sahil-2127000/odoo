// Pages under /admin (shown inside DashboardLayout). Owner: Frontend 1.
import { Route } from 'react-router-dom'
import Overview from '@/pages/admin/Overview'
import Products from '@/pages/admin/Products'
import Kits from '@/pages/admin/Kits'
import Users from '@/pages/admin/Users'
import Invoices from '@/pages/admin/Invoices'
import UiKit from '@/pages/admin/UiKit'

const adminRoutes = (
  <>
    <Route index element={<Overview />} />
    <Route path="products" element={<Products />} />
    <Route path="kits" element={<Kits />} />
    <Route path="users" element={<Users />} />
    <Route path="invoices" element={<Invoices />} />
    {/* Live preview of all shared components, for teammates */}
    <Route path="ui-kit" element={<UiKit />} />
  </>
)

export default adminRoutes
