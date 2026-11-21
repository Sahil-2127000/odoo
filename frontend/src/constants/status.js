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

// Status names, exactly as the backend models use them:
//   Enquiry: new -> follow_up -> converted / lost
//   Survey:  pending -> approved / rejected (survey must be approved before an enquiry converts)
//   Order:   quoted -> confirmed -> packed -> dispatched -> delivered -> installed (only the next step is allowed)
//   Ticket:  open -> assigned -> resolved -> confirmed (customer confirms the repair works)
export const ENQUIRY_STATUSES = ['new', 'follow_up', 'converted', 'lost']
export const SURVEY_STATUSES = ['pending', 'approved', 'rejected']
export const ORDER_STATUSES = ['quoted', 'confirmed', 'packed', 'dispatched', 'delivered', 'installed']
export const TICKET_STATUSES = ['open', 'assigned', 'resolved', 'confirmed']

// Colour of each status badge
export const STATUS_COLORS = {
  // Enquiry
  new: 'blue',
  follow_up: 'amber',
  converted: 'green',
  lost: 'red',
  // Survey
  pending: 'amber',
  approved: 'green',
  rejected: 'red',
  // Order
  quoted: 'purple',
  confirmed: 'blue',
  packed: 'amber',
  dispatched: 'orange',
  delivered: 'green',
  installed: 'green',
  // Ticket (confirmed is shared with Order above)
  open: 'red',
  assigned: 'blue',
  resolved: 'green',
  // Used only by the Operations / Technician mock screens
  in_stock: 'green',
  scheduled: 'blue',
  in_progress: 'amber',
  completed: 'green',
  closed: 'gray',
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
