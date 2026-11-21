// Small display helpers shared by Operations pages.

const inr = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })

export const formatINR = (n) => inr.format(Number(n) || 0)

// solar_panel -> Solar panel
export const labelize = (value) => {
  const s = String(value ?? '').replaceAll('_', ' ')
  return s.charAt(0).toUpperCase() + s.slice(1)
}

// 240 -> "20 yrs", 18 -> "18 mo", 0 -> "None"
export const formatWarranty = (months) => {
  const m = Number(months) || 0
  if (m === 0) return 'None'
  if (m % 12 === 0) return `${m / 12} yr${m === 12 ? '' : 's'}`
  return `${m} mo`
}

// Badge colour per SerialItem status.
export const SERIAL_STATUS_TONE = { in_stock: 'green', reserved: 'amber', installed: 'blue', defective: 'red' }

export const formatDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'
