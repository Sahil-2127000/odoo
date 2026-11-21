// Fake orders and repair bills for the Invoices page.
// Orders use Sahil's Order model: code, customer, items [{ product, qty, price }], total (incl. 18% GST), amountPaid, status
// Repair bills are tickets for out-of-warranty repairs: code, customer, order, issue, status, repairCharge, amountPaid

const daysAgo = (n) => new Date(Date.now() - n * 24 * 60 * 60 * 1000).toISOString()

const customers = {
  meena: { code: 'CU-1051', name: 'Meena Gupta', phone: '9811122233', address: 'B-42, Sector 50, Noida' },
  arjun: { code: 'CU-1049', name: 'Arjun Mehta', phone: '9812233344', address: '17 DLF Phase 2, Gurugram' },
  kavita: { code: 'CU-1047', name: 'Kavita Rao', phone: '9813344455', address: '8 Lajpat Nagar, New Delhi' },
  neha: { code: 'CU-1043', name: 'Neha Kapoor', phone: '9814455566', address: '22 Model Town, New Delhi' },
  sanjay: { code: 'CU-1041', name: 'Sanjay Yadav', phone: '9815566677', address: '5 Sector 15, Faridabad' },
  sunita: { code: 'CU-1031', name: 'Sunita Sharma', phone: '9816677788', address: '91 Raj Nagar, Ghaziabad' },
  deepak: { code: 'CU-1027', name: 'Deepak Jain', phone: '9817788899', address: '3 Vasant Kunj, New Delhi' },
}

// Products as they come back inside an order
const panel = { name: 'Mono PERC Panel 540 W', category: 'panel', warrantyYears: 25 }
const inverter3 = { name: 'On-Grid Inverter 3 kW', category: 'inverter', warrantyYears: 10 }
const inverter5 = { name: 'On-Grid Inverter 5 kW', category: 'inverter', warrantyYears: 10 }
const mounting = { name: 'Mounting Structure (per kW)', category: 'other', warrantyYears: 5 }
const cables = { name: 'DC Cable Set', category: 'other', warrantyYears: 2 }

const kit3kW = [
  { product: panel, qty: 6, price: 18500 },
  { product: inverter3, qty: 1, price: 36000 },
  { product: mounting, qty: 3, price: 6000 },
  { product: cables, qty: 1, price: 3000 },
]
const kit5kW = [
  { product: panel, qty: 10, price: 18500 },
  { product: inverter5, qty: 1, price: 52000 },
  { product: mounting, qty: 5, price: 6000 },
  { product: cables, qty: 1, price: 3000 },
]

// total = items + 18% GST, like the backend
const withTotal = (order) => ({
  ...order,
  total: Math.round(order.items.reduce((sum, i) => sum + i.price * i.qty, 0) * 1.18),
})

export const mockOrders = [
  { _id: 'o1', code: 'SC-1051', customer: customers.meena, items: kit3kW, amountPaid: 50000, status: 'confirmed', createdAt: daysAgo(2) },
  { _id: 'o2', code: 'SC-1049', customer: customers.arjun, items: kit5kW, amountPaid: 150000, status: 'packed', createdAt: daysAgo(5) },
  { _id: 'o3', code: 'SC-1047', customer: customers.kavita, items: kit3kW, amountPaid: 0, status: 'quoted', createdAt: daysAgo(6) },
  { _id: 'o4', code: 'SC-1043', customer: customers.neha, items: kit5kW, amountPaid: 318600, status: 'installed', createdAt: daysAgo(18) },
  { _id: 'o5', code: 'SC-1041', customer: customers.sanjay, items: kit3kW, amountPaid: 120000, status: 'delivered', createdAt: daysAgo(24) },
  { _id: 'o6', code: 'SC-1031', customer: customers.sunita, items: kit3kW, amountPaid: 198240, status: 'installed', createdAt: daysAgo(40) },
].map(withTotal)

export const mockRepairBills = [
  { _id: 't1', code: 'TK-1198', customer: customers.deepak, order: { code: 'SC-1027' }, issue: 'Replaced damaged DC cable after rodent bite (not covered by warranty)', status: 'resolved', repairCharge: 3500, amountPaid: 3500, createdAt: daysAgo(3) },
  { _id: 't2', code: 'TK-1201', customer: customers.sunita, order: { code: 'SC-1031' }, issue: 'Panel cleaning and re-tightening of mounts after storm', status: 'assigned', repairCharge: 2500, amountPaid: 0, createdAt: daysAgo(1) },
]
