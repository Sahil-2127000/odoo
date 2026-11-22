// Customer portal pages, rendered under /customer (inside DashboardLayout).
import { Route } from 'react-router-dom'
import MyOrders from '@/pages/customer/MyOrders'
import Warranty from '@/pages/customer/Warranty'
import Complaints from '@/pages/customer/Complaints'

const customerRoutes = (
  <>
    <Route index element={<MyOrders />} />
    <Route path="warranty" element={<Warranty />} />
    <Route path="complaints" element={<Complaints />} />
  </>
)

export default customerRoutes
