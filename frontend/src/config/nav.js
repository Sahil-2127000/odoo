import navAdmin from './nav.admin'
import navSales from './nav.sales'
import navOperations from './nav.operations'
import navCustomer from './nav.customer'

// Sidebar links for each role. (Technicians use the mobile layout with no sidebar.)
export const NAV_BY_ROLE = {
  admin: navAdmin,
  customer_care: navSales,
  warehouse: navOperations,
  customer: navCustomer,
}
