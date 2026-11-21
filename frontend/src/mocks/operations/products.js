import { productCatalog } from './productCatalog'
import { daysAgo } from './dates'

// stockQty is only used for products with trackSerial: false.
// For serial-tracked products, stock is counted from SerialItem documents.
const untrackedStock = {
  'MNT-GI-1KW-RCC': 14,
  'MNT-GI-3KW-RCC': 6, // below reorder level -> low stock demo
  'MNT-AL-1KW-TIN': 12,
  'CBL-POL-4SQ-DC': 1200,
  'CBL-POL-6SQ-DC': 650,
  'CBL-HAV-4SQ-AC': 240, // below reorder level
  'CBL-EARTH-16SQ': 180,
  'ELC-ACDB-1PH': 18,
  'ELC-DCDB-1IN': 16,
  'ELC-EARTH-KIT': 22,
  'ELC-LA-ESE': 9, // below reorder level
  'ACC-MC4-PAIR': 340,
  'ACC-CONDUIT-25': 600,
  'ACC-NETMETER': 7,
}

export const products = productCatalog.map((p, i) => ({
  _id: `prd_${String(i + 1).padStart(3, '0')}`,
  ...p,
  warehouse: 'Main Warehouse - Ludhiana',
  stockQty: p.trackSerial ? 0 : (untrackedStock[p.sku] ?? 0),
  isActive: true,
  createdAt: daysAgo(400),
  updatedAt: daysAgo(10),
}))

export const productIdBySku = Object.fromEntries(products.map((p) => [p.sku, p._id]))
