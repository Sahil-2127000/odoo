// Shared constants. Status values are lowercase snake_case (must match Mongoose enums exactly).

export const ROLES = {
  ADMIN: 'admin',
  SALES: 'sales',
  OPERATIONS: 'operations',
}

// Where each role lands after login.
export const ROLE_HOME = {
  [ROLES.ADMIN]: '/admin',
  [ROLES.SALES]: '/sales',
  [ROLES.OPERATIONS]: '/operations',
}

// Badge tones -> Tailwind classes (kept as full strings so Tailwind can see them).
export const TONE_CLASSES = {
  gray: 'bg-slate-100 text-slate-700 ring-slate-200',
  blue: 'bg-info-50 text-info-700 ring-info-500/20',
  green: 'bg-success-50 text-success-700 ring-success-500/20',
  amber: 'bg-warning-50 text-warning-700 ring-warning-500/20',
  red: 'bg-danger-50 text-danger-700 ring-danger-500/20',
  orange: 'bg-primary-50 text-primary-700 ring-primary-500/20',
  purple: 'bg-violet-50 text-violet-700 ring-violet-500/20',
}

// status value -> tone. Add new statuses here (tell Dev 2) instead of hard-coding colours in pages.
export const STATUS_COLORS = {
  // Lead
  new: 'blue',
  contacted: 'purple',
  qualified: 'orange',
  converted: 'green',
  lost: 'red',

  // Site survey
  scheduled: 'blue',
  completed: 'green',
  approved: 'green',
  rejected: 'red',

  // Quotation
  draft: 'gray',
  sent: 'blue',
  accepted: 'green',
  expired: 'gray',

  // Order / installation
  confirmed: 'blue',
  in_progress: 'amber',
  installed: 'green',
  cancelled: 'red',
  on_hold: 'gray',

  // Payment
  pending: 'amber',
  partial: 'orange',
  paid: 'green',
  overdue: 'red',

  // Inventory / serials
  in_stock: 'green',
  low_stock: 'amber',
  out_of_stock: 'red',
  reserved: 'purple',
  dispatched: 'blue',

  // Warranty
  active: 'green',
  void: 'red',

  // Service ticket
  open: 'red',
  assigned: 'blue',
  resolved: 'green',
  closed: 'gray',

  // Users / technicians
  available: 'green',
  busy: 'amber',
  inactive: 'gray',
}

export const statusTone = (status) => STATUS_COLORS[status] ?? 'gray'

// "in_progress" -> "In progress"
export const statusLabel = (status = '') => {
  const s = String(status).replace(/_/g, ' ')
  return s.charAt(0).toUpperCase() + s.slice(1)
}
