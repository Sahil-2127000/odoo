// Child routes for /operations/*. Mount them under the operations layout + role guard, e.g.
//   { path: '/operations', element: <RoleRoute role="operations"><AppLayout nav={operationsNav} /></RoleRoute>, children: operationsRoutes }
import OverviewPage from '../pages/operations/OverviewPage'
import ProductsPage from '../pages/operations/ProductsPage'
import InventoryPage from '../pages/operations/InventoryPage'
import SerialLookupPage from '../pages/operations/SerialLookupPage'
import FulfilmentPage from '../pages/operations/FulfilmentPage'
import InstallationsPage from '../pages/operations/InstallationsPage'
import TechniciansPage from '../pages/operations/TechniciansPage'
import WarrantiesPage from '../pages/operations/WarrantiesPage'
import TicketsPage from '../pages/operations/TicketsPage'

export const operationsRoutes = [
  { index: true, element: <OverviewPage /> },
  { path: 'products', element: <ProductsPage /> },
  { path: 'inventory', element: <InventoryPage /> },
  { path: 'serials', element: <SerialLookupPage /> },
  { path: 'serials/:serialNumber', element: <SerialLookupPage /> },
  { path: 'fulfilment', element: <FulfilmentPage /> },
  { path: 'installations', element: <InstallationsPage /> },
  { path: 'technicians', element: <TechniciansPage /> },
  { path: 'warranties', element: <WarrantiesPage /> },
  { path: 'tickets', element: <TicketsPage /> },
]
