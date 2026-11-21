// Owner: Sales (Rakhi). Child routes rendered under /sales (inside DashboardLayout).
import { Route } from 'react-router-dom'
import Enquiries from '@/pages/sales/Enquiries'
import FollowUps from '@/pages/sales/FollowUps'
import Customers from '@/pages/sales/Customers'
import Orders from '@/pages/sales/Orders'
import Complaints from '@/pages/sales/Complaints'

const salesRoutes = (
  <>
    <Route index element={<Enquiries />} />
    <Route path="follow-ups" element={<FollowUps />} />
    <Route path="customers" element={<Customers />} />
    <Route path="orders" element={<Orders />} />
    <Route path="complaints" element={<Complaints />} />
  </>
)

export default salesRoutes
