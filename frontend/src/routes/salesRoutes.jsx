// Owners: Sales (Rakhi) + Dev 3. Child routes rendered under /sales (inside DashboardLayout).
import { Route } from 'react-router-dom'
// Rakhi's pages (from main)
import Enquiries from '@/pages/sales/Enquiries'
import FollowUps from '@/pages/sales/FollowUps'
import Customers from '@/pages/sales/Customers'
import Orders from '@/pages/sales/Orders'
import Complaints from '@/pages/sales/Complaints'
// Dev 3's pages (from feature-sales)
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
    <Route index element={<Enquiries />} />
    <Route path="follow-ups" element={<FollowUps />} />
    <Route path="complaints" element={<Complaints />} />
    <Route path="customer-history" element={<Customers />} />
    <Route path="kit-orders" element={<Orders />} />

    <Route path="dashboard" element={<SalesDashboard />} />
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
