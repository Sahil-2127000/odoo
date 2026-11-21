// Mock users for login while Dev 1's /auth/login is not ready.
// Any password works in mock mode.
export const mockUsers = [
  { _id: 'u_admin', name: 'Admin User', email: 'admin@sunpower.com', role: 'admin' },
  { _id: 'u_sales', name: 'Sales Executive', email: 'sales@sunpower.com', role: 'sales' },
  { _id: 'u_ops', name: 'Operations Manager', email: 'ops@sunpower.com', role: 'operations' },
]
