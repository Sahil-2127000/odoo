import { daysAgo } from './dates'
import { productIdBySku, products } from './products'

// Operations-side copy of orders (Dev 3 creates real ones via quotation Accept).
// status: confirmed (awaiting reservation) | reserved | installation_scheduled | installed | cancelled
// systemType: on_grid | off_grid

const priceOf = (sku) => products.find((p) => p.sku === sku).price
const line = (sku, quantity) => ({ product: productIdBySku[sku], quantity, unitPrice: priceOf(sku) })

const onGrid3kW = () => [
  line('PNL-WAA-540-MONO', 6),
  line('INV-GRW-3K-ONG', 1),
  line('MNT-GI-3KW-RCC', 1),
  line('CBL-POL-4SQ-DC', 30),
  line('CBL-HAV-4SQ-AC', 20),
  line('ELC-ACDB-1PH', 1),
  line('ELC-DCDB-1IN', 1),
  line('ELC-EARTH-KIT', 1),
  line('ELC-LA-ESE', 1),
  line('ACC-MC4-PAIR', 4),
]

const onGrid5kW = () => [
  line('PNL-WAA-540-MONO', 10),
  line('INV-GRW-5K-ONG', 1),
  line('MNT-GI-3KW-RCC', 2),
  line('CBL-POL-6SQ-DC', 40),
  line('CBL-HAV-4SQ-AC', 25),
  line('ELC-ACDB-1PH', 1),
  line('ELC-DCDB-1IN', 1),
  line('ELC-EARTH-KIT', 2),
  line('ELC-LA-ESE', 1),
  line('ACC-MC4-PAIR', 6),
]

const offGrid3kW = () => [
  line('PNL-ADA-445-MONO', 7),
  line('INV-LUM-3K-OFG', 1),
  line('BAT-LUM-200AH-TUB', 3),
  line('CC-LUM-40A-MPPT', 1),
  line('MNT-GI-3KW-RCC', 1),
  line('CBL-POL-4SQ-DC', 30),
  line('CBL-HAV-4SQ-AC', 15),
  line('ELC-DCDB-1IN', 1),
  line('ELC-EARTH-KIT', 1),
  line('ACC-MC4-PAIR', 4),
]

const onGrid1kW = () => [
  line('PNL-VIK-335-POLY', 3),
  line('INV-HAV-1K-ONG', 1),
  line('MNT-AL-1KW-TIN', 1),
  line('CBL-POL-4SQ-DC', 15),
  line('CBL-HAV-4SQ-AC', 10),
  line('ELC-ACDB-1PH', 1),
  line('ELC-DCDB-1IN', 1),
  line('ELC-EARTH-KIT', 1),
  line('ACC-MC4-PAIR', 2),
]

const withTotal = (o) => ({
  ...o,
  totalAmount: o.items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0),
})

export const orders = [
  // Installed ~30 months ago: inverter warranty expired, panels still active.
  { _id: 'ord_001', orderNumber: 'SO-2024-0012', customer: 'cus_001', systemType: 'on_grid', systemSizeKw: 3, status: 'installed', items: onGrid3kW(), createdAt: daysAgo(930) },
  // Installed ~18 months ago: the "rainy season breakdown" customer.
  { _id: 'ord_002', orderNumber: 'SO-2025-0047', customer: 'cus_002', systemType: 'on_grid', systemSizeKw: 5, status: 'installed', items: onGrid5kW(), createdAt: daysAgo(560) },
  // Reserved, installation scheduled in 2 days.
  { _id: 'ord_003', orderNumber: 'SO-2026-0101', customer: 'cus_003', systemType: 'off_grid', systemSizeKw: 3, status: 'installation_scheduled', items: offGrid3kW(), createdAt: daysAgo(12) },
  // Reserved, installation in progress today.
  { _id: 'ord_004', orderNumber: 'SO-2026-0104', customer: 'cus_004', systemType: 'on_grid', systemSizeKw: 1, status: 'installation_scheduled', items: onGrid1kW(), createdAt: daysAgo(9) },
  // Confirmed, awaiting reservation (demo: reserve these from the UI).
  { _id: 'ord_005', orderNumber: 'SO-2026-0109', customer: 'cus_005', systemType: 'on_grid', systemSizeKw: 3, status: 'confirmed', items: onGrid3kW(), createdAt: daysAgo(3) },
  { _id: 'ord_006', orderNumber: 'SO-2026-0112', customer: 'cus_006', systemType: 'off_grid', systemSizeKw: 3, status: 'confirmed', items: offGrid3kW(), createdAt: daysAgo(1) },
].map(withTotal)
