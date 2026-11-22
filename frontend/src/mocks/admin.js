// Fake master data for the admin pages. Field names match Sahil's backend models.

// Product model: name, category, costPrice, sellPrice, stock, minStock, warrantyYears
export const mockProducts = [
  { _id: 'p1', name: 'Mono PERC Panel 540 W', category: 'panel', costPrice: 14500, sellPrice: 18500, stock: 64, minStock: 20, warrantyYears: 25 },
  { _id: 'p2', name: 'Bifacial Panel 550 W', category: 'panel', costPrice: 16000, sellPrice: 20500, stock: 12, minStock: 20, warrantyYears: 25 },
  { _id: 'p3', name: 'On-Grid Inverter 3 kW', category: 'inverter', costPrice: 28000, sellPrice: 36000, stock: 9, minStock: 5, warrantyYears: 10 },
  { _id: 'p4', name: 'On-Grid Inverter 5 kW', category: 'inverter', costPrice: 41000, sellPrice: 52000, stock: 3, minStock: 5, warrantyYears: 10 },
  { _id: 'p5', name: 'Hybrid Inverter 3 kW', category: 'inverter', costPrice: 39000, sellPrice: 48000, stock: 6, minStock: 4, warrantyYears: 10 },
  { _id: 'p6', name: 'Lithium Battery 5 kWh', category: 'battery', costPrice: 85000, sellPrice: 105000, stock: 2, minStock: 3, warrantyYears: 8 },
  { _id: 'p7', name: 'Mounting Structure (per kW)', category: 'other', costPrice: 4500, sellPrice: 6000, stock: 40, minStock: 10, warrantyYears: 5 },
  { _id: 'p8', name: 'DC Cable Set', category: 'other', costPrice: 2200, sellPrice: 3000, stock: 55, minStock: 15, warrantyYears: 2 },
]

// Kit model: name, items: [{ product, qty }], price (sum of sellPrice x qty)
export const mockKits = [
  {
    _id: 'k1',
    name: '3 kW On-Grid Kit',
    items: [
      { product: 'p1', qty: 6 },
      { product: 'p3', qty: 1 },
      { product: 'p7', qty: 3 },
      { product: 'p8', qty: 1 },
    ],
  },
  {
    _id: 'k2',
    name: '5 kW On-Grid Kit',
    items: [
      { product: 'p1', qty: 10 },
      { product: 'p4', qty: 1 },
      { product: 'p7', qty: 5 },
      { product: 'p8', qty: 1 },
    ],
  },
  {
    _id: 'k3',
    name: '3 kW Hybrid Kit with Battery',
    items: [
      { product: 'p1', qty: 6 },
      { product: 'p5', qty: 1 },
      { product: 'p6', qty: 1 },
      { product: 'p7', qty: 3 },
    ],
  },
]

// User model (staff only): name, email, phone, role, isActive
export const mockStaff = [
  { _id: 'u1', name: 'Admin', email: 'admin@solarflow.in', phone: '9810000001', role: 'admin', isActive: true, createdAt: '2026-10-01T10:00:00.000Z' },
  { _id: 'u2', name: 'Simran Kaur', email: 'care@solarflow.in', phone: '9810000002', role: 'customer_care', isActive: true, createdAt: '2026-10-03T10:00:00.000Z' },
  { _id: 'u3', name: 'Manoj Kumar', email: 'warehouse@solarflow.in', phone: '9810000003', role: 'warehouse', isActive: true, createdAt: '2026-10-05T10:00:00.000Z' },
  { _id: 'u4', name: 'Gurpreet Singh', email: 'tech@solarflow.in', phone: '9810000004', role: 'technician', isActive: true, createdAt: '2026-10-08T10:00:00.000Z' },
  { _id: 'u5', name: 'Amit Kumar', email: 'amit@solarflow.in', phone: '9810000005', role: 'technician', isActive: false, createdAt: '2026-10-12T10:00:00.000Z' },
]
