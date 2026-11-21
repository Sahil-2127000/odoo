// Owner: Dev 3. Child routes rendered under /sales (inside DashboardLayout).
import { Route } from 'react-router-dom'
import SalesDashboard from '@/pages/sales/Dashboard'
import LeadsPage from '@/pages/sales/LeadsPage'
import CustomersPage from '@/pages/sales/CustomersPage'
import CustomerDetailPage from '@/pages/sales/CustomerDetailPage'
import SurveysPage from '@/pages/sales/SurveysPage'
import QuotationsPage from '@/pages/sales/QuotationsPage'
import QuotationBuilderPage from '@/pages/sales/QuotationBuilderPage'
import QuotationPrintPage from '@/pages/sales/QuotationPrintPage'
import OrdersPage from '@/pages/sales/OrdersPage'
import OrderDetailPage from '@/pages/sales/OrderDetailPage'
import PaymentsPage from '@/pages/sales/PaymentsPage'

const salesRoutes = (
  <>
    <Route index element={<SalesDashboard />} />
    <Route path="leads" element={<LeadsPage />} />
    <Route path="customers" element={<CustomersPage />} />
    <Route path="customers/:id" element={<CustomerDetailPage />} />
    <Route path="surveys" element={<SurveysPage />} />
    <Route path="quotations" element={<QuotationsPage />} />
    <Route path="quotations/new" element={<QuotationBuilderPage />} />
    <Route path="quotations/:id/edit" element={<QuotationBuilderPage />} />
    <Route path="quotations/:id/print" element={<QuotationPrintPage />} />
    <Route path="orders" element={<OrdersPage />} />
    <Route path="orders/:id" element={<OrderDetailPage />} />
    <Route path="payments" element={<PaymentsPage />} />
  </>
)

export default salesRoutes
