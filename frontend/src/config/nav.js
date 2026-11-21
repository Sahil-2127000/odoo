import navAdmin from './nav.admin'
import navSales from './nav.sales'
import navOperations from './nav.operations'

export const NAV_BY_ROLE = {
  admin: navAdmin,
  sales: navSales,
  operations: navOperations,
}

export const ROLE_LABELS = {
  admin: 'Admin',
  sales: 'Sales',
  operations: 'Operations',
}
