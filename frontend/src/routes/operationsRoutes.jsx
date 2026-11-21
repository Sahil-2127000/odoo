// Owner: Dev 4. Child routes rendered under /operations (inside DashboardLayout).
import { Route } from 'react-router-dom'
import OverviewPage from '@/pages/operations/OverviewPage'
import ProductsPage from '@/pages/operations/ProductsPage'
import InventoryPage from '@/pages/operations/InventoryPage'
import SerialLookupPage from '@/pages/operations/SerialLookupPage'
import FulfilmentPage from '@/pages/operations/FulfilmentPage'
import InstallationsPage from '@/pages/operations/InstallationsPage'
import TechniciansPage from '@/pages/operations/TechniciansPage'
import WarrantiesPage from '@/pages/operations/WarrantiesPage'
import TicketsPage from '@/pages/operations/TicketsPage'

const operationsRoutes = (
  <>
    <Route index element={<OverviewPage />} />
    <Route path="products" element={<ProductsPage />} />
    <Route path="inventory" element={<InventoryPage />} />
    <Route path="serials" element={<SerialLookupPage />} />
    <Route path="serials/:serialNumber" element={<SerialLookupPage />} />
    <Route path="fulfilment" element={<FulfilmentPage />} />
    <Route path="installations" element={<InstallationsPage />} />
    <Route path="technicians" element={<TechniciansPage />} />
    <Route path="warranties" element={<WarrantiesPage />} />
    <Route path="tickets" element={<TicketsPage />} />
  </>
)

export default operationsRoutes
