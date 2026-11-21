// Fake staff users for login while the backend is not running (any password works).
// Roles match the backend User model: admin, customer_care, warehouse, technician.
export const mockUsers = [
  { _id: 'u1', name: 'Anita Director', email: 'admin@solarconnect.com', role: 'admin' },
  { _id: 'u2', name: 'Rahul Sales', email: 'sales@solarconnect.com', role: 'customer_care' },
  { _id: 'u3', name: 'Vikram Store', email: 'warehouse@solarconnect.com', role: 'warehouse' },
  { _id: 'u4', name: 'Suresh Technician', email: 'tech@solarconnect.com', role: 'technician' },
]
