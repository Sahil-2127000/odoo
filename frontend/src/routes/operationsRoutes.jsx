// Owner: Dev 4. Child routes rendered under /operations (inside DashboardLayout).
// Replace the ComingSoon placeholders with your pages from src/pages/operations/.
import { Route } from 'react-router-dom'
import OperationsDashboard from '@/pages/operations/Dashboard'
import ComingSoon from '@/pages/common/ComingSoon'

const operationsRoutes = (
  <>
    <Route index element={<OperationsDashboard />} />
    <Route path="products" element={<ComingSoon title="Products" />} />
    <Route path="inventory" element={<ComingSoon title="Inventory" />} />
    <Route path="installations" element={<ComingSoon title="Installations" />} />
    <Route path="technicians" element={<ComingSoon title="Technicians" />} />
    <Route path="warranty" element={<ComingSoon title="Warranty" />} />
    <Route path="tickets" element={<ComingSoon title="Service tickets" />} />
  </>
)

export default operationsRoutes
