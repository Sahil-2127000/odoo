// Shared labels and helpers for the Sales pages.
export { formatCurrency, formatDate, formatDateTime } from '@/utils/format'

export const PAYMENT_MODES = [
  { value: 'bank_transfer', label: 'Bank transfer (NEFT/RTGS)' },
  { value: 'upi', label: 'UPI' },
  { value: 'cheque', label: 'Cheque' },
  { value: 'cash', label: 'Cash' },
  { value: 'credit_card', label: 'Credit card' },
]

export const modeLabel = (mode) => PAYMENT_MODES.find((m) => m.value === mode)?.label || mode || '—'

export const SYSTEM_TYPES = [
  { value: 'on_grid', label: 'On-Grid' },
  { value: 'off_grid', label: 'Off-Grid' },
]

export const systemTypeLabel = (t) => SYSTEM_TYPES.find((s) => s.value === t)?.label || t || '—'

export const DEFAULT_GST_RATE = 13.8

/** Totals for a list of quotation lines, matching mockDb.createQuotation. */
export function computeTotals(lines, gstRate = DEFAULT_GST_RATE, discount = 0) {
  const subtotal = lines.reduce((sum, l) => sum + (Number(l.qty) || 0) * (Number(l.unitPrice) || 0), 0)
  const gstAmount = Math.round(subtotal * (Number(gstRate) / 100) * 100) / 100
  const grandTotal = Math.round((subtotal + gstAmount - (Number(discount) || 0)) * 100) / 100
  return { subtotal, gstAmount, grandTotal }
}

/** Read a list from an API envelope ({ success, data }), tolerating a bare array. */
export const listFrom = (res) => (Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [])
