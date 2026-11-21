const inr = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
})

const inrCompact = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  notation: 'compact',
  maximumFractionDigits: 1,
})

/** 150000 -> "₹1,50,000"; compact: true -> "₹1.5L" */
export function formatCurrency(value, { compact = false } = {}) {
  const n = Number(value)
  if (value === null || value === undefined || Number.isNaN(n)) return '—'
  return compact ? inrCompact.format(n) : inr.format(n)
}

/** Same as formatCurrency: 150000 -> "₹1,50,000" (name used in the team brief) */
export const formatINR = formatCurrency

/** 12345 -> "12,345" */
export function formatNumber(value) {
  const n = Number(value)
  if (value === null || value === undefined || Number.isNaN(n)) return '—'
  return n.toLocaleString('en-IN')
}

/** 0.4567 -> "45.7%" (pass a ratio) */
export function formatPercent(ratio, digits = 1) {
  const n = Number(ratio)
  if (ratio === null || ratio === undefined || Number.isNaN(n)) return '—'
  return `${(n * 100).toFixed(digits)}%`
}

/** ISO/Date -> "21 Nov 2026" */
export function formatDate(value) {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

/** ISO/Date -> "21 Nov 2026, 2:30 pm" */
export function formatDateTime(value) {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

/** 3 -> "3 kW" */
export const formatKw = (kw) => (kw || kw === 0 ? `${kw} kW` : '—')

/** "Purvika Sharma" -> "PS" */
export const initials = (name = '') =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('')
