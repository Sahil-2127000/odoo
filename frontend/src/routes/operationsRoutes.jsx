// Owner: Warehouse (Raman). Child routes rendered under /operations (inside DashboardLayout).
import { Route } from 'react-router-dom'
import Stock from '@/pages/operations/Stock'
import OrdersToProcess from '@/pages/operations/OrdersToProcess'
import Installations from '@/pages/operations/Installations'
import Warranties from '@/pages/operations/Warranties'

const operationsRoutes = (
  <>
    <Route index element={<Stock />} />
    <Route path="orders" element={<OrdersToProcess />} />
    <Route path="installations" element={<Installations />} />
    <Route path="warranties" element={<Warranties />} />
  </>
)

export default operationsRoutes
