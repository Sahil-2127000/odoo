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

// Badge colour per Technician status.
export const TECH_STATUS_TONE = { available: 'green', on_job: 'blue', leave: 'amber' }

export const formatDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'

// "Today", "Tomorrow", "Yesterday", or "Wed, 25 Nov" for grouping jobs by day.
export const dayLabel = (iso) => {
  const d = new Date(iso)
  const startOf = (x) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime()
  const diff = Math.round((startOf(d) - startOf(new Date())) / 86400000)
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Tomorrow'
  if (diff === -1) return 'Yesterday'
  return d.toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short', ...(Math.abs(diff) > 300 ? { year: 'numeric' } : {}) })
}

// Whole months between two dates (ignores days).
const monthsBetween = (from, to) => (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth())

const spell = (months) => {
  const y = Math.floor(months / 12)
  const m = months % 12
  return [y && `${y} yr${y > 1 ? 's' : ''}`, m && `${m} mo`].filter(Boolean).join(' ') || 'less than a month'
}

// "19 yrs 4 mo left" or "expired 6 mo ago"
export const warrantyTimeLeft = (endIso) => {
  const now = new Date()
  const end = new Date(endIso)
  return end > now ? `${spell(monthsBetween(now, end))} left` : `expired ${spell(monthsBetween(end, now))} ago`
}
