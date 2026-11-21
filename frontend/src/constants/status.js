// Shared constants. Values must match the backend exactly.

// Staff roles (same as the backend User model)
export const ROLES = {
  ADMIN: 'admin',
  SALES: 'customer_care',
  WAREHOUSE: 'warehouse',
  TECHNICIAN: 'technician',
}

// Page each role lands on after login
export const ROLE_HOME = {
  admin: '/admin',
  customer_care: '/sales',
  warehouse: '/operations',
  technician: '/tech',
}

// Names shown in the sidebar and top bar
export const ROLE_LABELS = {
  admin: 'Admin',
  customer_care: 'Sales',
  warehouse: 'Warehouse',
  technician: 'Technician',
}

// Frozen status names from the team brief (do not invent new ones):
//   Lead:   new -> contacted -> survey_scheduled -> surveyed -> quoted -> won / lost
//   Survey: pending -> approved / rejected
//   Order:  quoted -> confirmed -> packed -> dispatched -> delivered -> installed -> closed
//   Serial: in_stock -> dispatched -> delivered
//   Job:    scheduled -> in_progress -> completed
//   Ticket: open -> assigned -> resolved -> confirmed
export const ORDER_STATUSES = ['quoted', 'confirmed', 'packed', 'dispatched', 'delivered', 'installed', 'closed']
export const TICKET_STATUSES = ['open', 'assigned', 'resolved', 'confirmed']

// Colour of each status badge
export const STATUS_COLORS = {
  // Lead
  new: 'blue',
  contacted: 'purple',
  survey_scheduled: 'amber',
  surveyed: 'orange',
  quoted: 'purple',
  won: 'green',
  lost: 'red',
  // Survey
  pending: 'amber',
  approved: 'green',
  rejected: 'red',
  // Order
  confirmed: 'blue',
  packed: 'amber',
  dispatched: 'orange',
  delivered: 'green',
  installed: 'green',
  closed: 'gray',
  // Serial unit
  in_stock: 'green',
  // Job
  scheduled: 'blue',
  in_progress: 'amber',
  completed: 'green',
  // Ticket
  open: 'red',
  assigned: 'blue',
  resolved: 'green',
}

// Colour name -> Tailwind classes (full strings so Tailwind can find them)
export const TONE_CLASSES = {
  gray: 'bg-slate-100 text-slate-700 ring-slate-200',
  blue: 'bg-info-50 text-info-700 ring-info-500/20',
  green: 'bg-success-50 text-success-700 ring-success-500/20',
  amber: 'bg-warning-50 text-warning-700 ring-warning-500/20',
  red: 'bg-danger-50 text-danger-700 ring-danger-500/20',
  orange: 'bg-primary-50 text-primary-700 ring-primary-500/20',
  purple: 'bg-violet-50 text-violet-700 ring-violet-500/20',
}

export const statusTone = (status) => STATUS_COLORS[status] ?? 'gray'

// "in_progress" -> "In progress"
export const statusLabel = (status = '') => {
  const text = String(status).replace(/_/g, ' ')
  return text.charAt(0).toUpperCase() + text.slice(1)
}
