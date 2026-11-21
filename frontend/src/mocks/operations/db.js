// In-memory mock database for the Operations module.
// Builds serial items, installations, warranties and tickets that are all linked
// to each other, so serial tracking works end to end before the real API exists.
// Only src/api/operations/* may import this file. Pages must never import mocks.

import { customers } from './customers'
import { addMonths, daysAgo, daysFromNow } from './dates'
import { orders } from './orders'
import { products } from './products'
import { technicians } from './technicians'

const productById = Object.fromEntries(products.map((p) => [p._id, p]))
const productBySku = Object.fromEntries(products.map((p) => [p.sku, p]))

// ---------- Serial items ----------
// status: in_stock | reserved | installed | defective
const serialItems = []
const seqByProduct = {}

const serialPrefix = (sku) => {
  const [, brand, model] = sku.split('-')
  return `${brand}${model}`
}

const makeSerial = (product, fields = {}) => {
  seqByProduct[product._id] = (seqByProduct[product._id] ?? 0) + 1
  const seq = String(1000 + seqByProduct[product._id]).padStart(5, '0')
  const year = new Date(fields.stockInDate ?? daysAgo(30)).getFullYear() % 100
  const item = {
    _id: `ser_${String(serialItems.length + 1).padStart(4, '0')}`,
    serialNumber: `${serialPrefix(product.sku)}-${year}-${seq}`,
    product: product._id,
    status: 'in_stock',
    warehouse: 'Main Warehouse - Ludhiana',
    order: null,
    customer: null,
    installation: null,
    warranty: null,
    stockInDate: daysAgo(30),
    notes: '',
    ...fields,
  }
  item.createdAt = item.stockInDate
  item.updatedAt = item.stockInDate
  serialItems.push(item)
  return item
}

// Free stock per serial-tracked product. A few are below reorderLevel on purpose.
const inStockCounts = {
  'PNL-WAA-540-MONO': 64,
  'PNL-ADA-445-MONO': 35,
  'PNL-TAT-550-BIF': 22,
  'PNL-VIK-335-POLY': 8, // low stock
  'INV-GRW-3K-ONG': 7,
  'INV-GRW-5K-ONG': 4, // low stock
  'INV-HAV-1K-ONG': 3,
  'INV-LUM-3K-OFG': 6,
  'INV-LUM-5K-OFG': 3,
  'BAT-EXI-150AH-TUB': 14,
  'BAT-LUM-200AH-TUB': 12,
  'BAT-AMR-5KWH-LFP': 1, // low stock
  'CC-LUM-40A-MPPT': 6,
  'CC-MIC-60A-MPPT': 2, // low stock
}

// ---------- Installations ----------
// status: scheduled | in_progress | completed | cancelled
const installationPlan = [
  { order: 'ord_001', status: 'completed', at: 915, technicians: ['tec_001', 'tec_002'] },
  { order: 'ord_002', status: 'completed', at: 560, technicians: ['tec_002', 'tec_004', 'tec_007'] },
  { order: 'ord_003', status: 'scheduled', at: -2, technicians: ['tec_003', 'tec_008'] },
  { order: 'ord_004', status: 'in_progress', at: 0, technicians: ['tec_001', 'tec_002', 'tec_007'] },
]

const installations = []
const warranties = []

installationPlan.forEach((plan, idx) => {
  const order = orders.find((o) => o._id === plan.order)
  const customer = customers.find((c) => c._id === order.customer)
  const date = plan.at >= 0 ? daysAgo(plan.at) : daysFromNow(-plan.at)
  const completed = plan.status === 'completed'

  const installation = {
    _id: `ins_${String(idx + 1).padStart(3, '0')}`,
    installationNumber: `INS-${String(idx + 1).padStart(4, '0')}`,
    order: order._id,
    customer: customer._id,
    scheduledDate: date,
    technicians: plan.technicians,
    status: plan.status,
    siteAddress: customer.address,
    systemSizeKw: order.systemSizeKw,
    startedAt: plan.status === 'scheduled' ? null : date,
    completedAt: completed ? date : null,
    notes: completed ? 'Generation tested OK. Customer signed off.' : '',
    createdAt: daysAgo(plan.at + 5),
    updatedAt: date,
  }
  installations.push(installation)

  // Reserve / install serials for each serial-tracked line on the order.
  order.items.forEach((lineItem) => {
    const product = productById[lineItem.product]
    if (!product.trackSerial) return
    for (let n = 0; n < lineItem.quantity; n++) {
      const serial = makeSerial(product, {
        status: completed ? 'installed' : 'reserved',
        order: order._id,
        customer: customer._id,
        installation: installation._id,
        stockInDate: daysAgo(Math.max(plan.at, 0) + 20),
      })
      if (completed) {
        const warranty = {
          _id: `war_${String(warranties.length + 1).padStart(4, '0')}`,
          warrantyNumber: `WAR-${String(warranties.length + 1).padStart(5, '0')}`,
          serialItem: serial._id,
          serialNumber: serial.serialNumber,
          product: product._id,
          customer: customer._id,
          order: order._id,
          installation: installation._id,
          startDate: installation.completedAt,
          endDate: addMonths(installation.completedAt, product.warrantyMonths),
          createdAt: installation.completedAt,
        }
        warranty.status = new Date(warranty.endDate) > new Date() ? 'active' : 'expired'
        warranties.push(warranty)
        serial.warranty = warranty._id
      }
    }
  })
})

// Free in-stock serials (created after the allocated ones so numbering looks natural).
Object.entries(inStockCounts).forEach(([sku, count]) => {
  const product = productBySku[sku]
  for (let n = 0; n < count; n++) {
    makeSerial(product, { stockInDate: daysAgo(n % 3 === 0 ? 45 : 12) })
  }
})

// One defective unit returned from site, to show the status in serial lookup.
makeSerial(productBySku['INV-GRW-3K-ONG'], { status: 'defective', notes: 'DOA - error code 117, returned to vendor' })

// ---------- Tickets ----------
// type: complaint | service | warranty_claim
// priority: low | medium | high | urgent
// status: open | assigned | in_progress | resolved | closed
const findSerial = (orderId, category) =>
  serialItems.find((s) => s.order === orderId && productById[s.product].category === category)

const inverterOrd2 = findSerial('ord_002', 'inverter')
const inverterOrd1 = findSerial('ord_001', 'inverter')
const panelOrd1 = findSerial('ord_001', 'solar_panel')

const tickets = [
  {
    customer: 'cus_002', order: 'ord_002', serialItem: inverterOrd2._id, warranty: inverterOrd2.warranty,
    type: 'warranty_claim', priority: 'high', status: 'in_progress', assignedTechnician: 'tec_003',
    subject: 'Inverter showing fault code, zero generation',
    description: 'Customer reports inverter display showing error 302 since heavy rain last night. No power output.',
    isBillable: false, createdAt: daysAgo(1),
  },
  {
    customer: 'cus_001', order: 'ord_001', serialItem: inverterOrd1._id, warranty: inverterOrd1.warranty,
    type: 'complaint', priority: 'urgent', status: 'assigned', assignedTechnician: 'tec_007',
    subject: 'Inverter tripping repeatedly',
    description: 'Inverter trips every afternoon. Warranty expired - parts and labour billable.',
    isBillable: true, createdAt: daysAgo(2),
  },
  {
    customer: 'cus_001', order: 'ord_001', serialItem: panelOrd1._id, warranty: panelOrd1.warranty,
    type: 'service', priority: 'low', status: 'resolved', assignedTechnician: 'tec_004',
    subject: 'Annual panel cleaning and health check',
    description: 'Yearly maintenance visit requested.',
    resolutionNotes: 'Panels cleaned, connections tightened, generation normal (4.1 kWh/kWp).',
    isBillable: true, createdAt: daysAgo(40), resolvedAt: daysAgo(38),
  },
  {
    customer: 'cus_002', order: 'ord_002', serialItem: null, warranty: null,
    type: 'complaint', priority: 'medium', status: 'open', assignedTechnician: null,
    subject: 'Generation lower than expected',
    description: 'Monthly units dropped by ~20% compared to last year. Requests inspection.',
    isBillable: false, createdAt: daysAgo(0),
  },
].map((t, i) => ({
  _id: `tkt_${String(i + 1).padStart(3, '0')}`,
  ticketNumber: `TKT-${String(i + 1).padStart(4, '0')}`,
  resolutionNotes: '',
  resolvedAt: null,
  ...t,
  updatedAt: t.resolvedAt ?? t.createdAt,
}))

// Mutable copy so mock create/update calls persist for the browser session.
export const db = structuredClone({
  products,
  technicians,
  customers,
  orders,
  serialItems,
  installations,
  warranties,
  tickets,
})
