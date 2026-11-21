// Owner: Dev 3. Child routes rendered under /sales (inside DashboardLayout).
// Replace the ComingSoon placeholders with your pages from src/pages/sales/.
import { Route } from 'react-router-dom'
import SalesDashboard from '@/pages/sales/Dashboard'
import ComingSoon from '@/pages/common/ComingSoon'

const salesRoutes = (
  <>
    <Route index element={<SalesDashboard />} />
    <Route path="leads" element={<ComingSoon title="Leads" />} />
    <Route path="customers" element={<ComingSoon title="Customers" />} />
    <Route path="surveys" element={<ComingSoon title="Site surveys" />} />
    <Route path="quotations" element={<ComingSoon title="Quotations" />} />
    <Route path="payments" element={<ComingSoon title="Payments" />} />
  </>
)

export default salesRoutes
