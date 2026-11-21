// Shared "Record payment" dialog used by the Orders, Order detail and Payments pages.
import { useEffect, useState } from 'react'
import { useToast } from '@/components/ui'
import { Button, Modal, Input, Select } from './ui'
import { paymentsApi, isGlobalMockEnabled } from '@/api/sales'
import { PAYMENT_MODES, formatCurrency } from './salesHelpers'

const today = () => new Date().toISOString().slice(0, 10)

/**
 * <RecordPaymentModal order={order} orders={[...]} isOpen onClose onRecorded={(result) => ...} />
 * Pass `order` to lock the order, or `orders` to let the user pick one with a balance.
 */
export default function RecordPaymentModal({ isOpen, onClose, order, orders = [], onRecorded }) {
  const toast = useToast()
  const [form, setForm] = useState({})
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  // Real backend stores only the amount paid, not the mode / reference / date.
  const live = !isGlobalMockEnabled()

  const payable = orders.filter((o) => (o.balanceAmount || 0) > 0)
  const selected = order || payable.find((o) => o.id === form.orderId)

  useEffect(() => {
    if (!isOpen) return
    const first = order || payable[0]
    setForm({
      orderId: first?.id || '',
      // Suggest 50% advance on a fresh order, otherwise the remaining balance.
      amount: first ? (first.paidAmount ? first.balanceAmount : Math.round(first.totalAmount / 2)) : '',
      mode: 'bank_transfer',
      reference: '',
      date: today(),
      notes: first && !first.paidAmount ? 'Advance booking payment' : '',
    })
    setErrors({})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, order?.id])

  const set = (name, value) => {
    setForm((f) => ({ ...f, [name]: value }))
    setErrors((e) => ({ ...e, [name]: undefined }))
  }

  const submit = async () => {
    const e = {}
    const amount = Number(form.amount)
    if (!selected) e.orderId = 'Choose an order'
    if (!(amount > 0)) e.amount = 'Enter an amount greater than zero'
    else if (selected && amount > selected.balanceAmount) e.amount = `Cannot exceed the balance of ${formatCurrency(selected.balanceAmount)}`
    if (!live && form.mode !== 'cash' && !form.reference?.trim()) e.reference = 'Enter the UTR / cheque / transaction number'
    if (!form.date) e.date = 'Choose the payment date'
    setErrors(e)
    if (Object.keys(e).length) return

    setSaving(true)
    const res = await paymentsApi.recordPayment({
      orderId: selected.id,
      amount,
      mode: form.mode,
      reference: form.reference.trim() || undefined,
      date: new Date(`${form.date}T12:00:00`).toISOString(),
      notes: form.notes,
    })
    setSaving(false)
    if (res?.success === false) {
      toast.error(res.message || 'Could not record payment')
      return
    }
    toast.success(res?.message || 'Payment recorded')
    onRecorded?.(res?.data)
    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Record payment"
      subtitle={selected ? `${selected.orderNumber} · ${selected.customerName}` : 'Collect against a confirmed order'}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button variant="success" onClick={submit} loading={saving}>Save receipt</Button>
        </>
      }
    >
      <div className="space-y-4">
        {live && (
          <p className="rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-700">
            The backend records the amount only. Mode, reference and notes are not saved yet.
          </p>
        )}
        {!order && (
          <Select
            label="Order"
            name="orderId"
            required
            value={form.orderId}
            onChange={(e) => set('orderId', e.target.value)}
            placeholder={payable.length ? 'Select order' : 'No orders with a balance'}
            options={payable.map((o) => ({ value: o.id, label: `${o.orderNumber} · ${o.customerName} · due ${formatCurrency(o.balanceAmount)}` }))}
            error={errors.orderId}
          />
        )}
        {selected && (
          <div className="grid grid-cols-3 gap-3 rounded-lg bg-slate-50 p-3 text-xs">
            <div><div className="text-slate-400">Order total</div><div className="font-semibold text-slate-800">{formatCurrency(selected.totalAmount)}</div></div>
            <div><div className="text-slate-400">Paid so far</div><div className="font-semibold text-emerald-700">{formatCurrency(selected.paidAmount)}</div></div>
            <div><div className="text-slate-400">Balance</div><div className="font-semibold text-rose-700">{formatCurrency(selected.balanceAmount)}</div></div>
          </div>
        )}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label="Amount" name="amount" type="number" min="1" prefix="₹" required value={form.amount} onChange={(e) => set('amount', e.target.value)} error={errors.amount} />
          <Input label="Payment date" name="date" type="date" required value={form.date} onChange={(e) => set('date', e.target.value)} error={errors.date} />
          <Select label="Mode" name="mode" value={form.mode} onChange={(e) => set('mode', e.target.value)} options={PAYMENT_MODES} />
          <Input
            label="Reference no."
            name="reference"
            required={!live && form.mode !== 'cash'}
            placeholder={form.mode === 'upi' ? 'UPI transaction ID' : form.mode === 'cheque' ? 'Cheque number' : 'UTR / NEFT reference'}
            value={form.reference}
            onChange={(e) => set('reference', e.target.value)}
            error={errors.reference}
          />
        </div>
        {selected && (
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="text-slate-400">Quick fill:</span>
            {!selected.paidAmount && (
              <button type="button" className="font-semibold text-amber-700 hover:underline" onClick={() => set('amount', Math.round(selected.totalAmount / 2))}>
                50% advance
              </button>
            )}
            <button type="button" className="font-semibold text-amber-700 hover:underline" onClick={() => set('amount', selected.balanceAmount)}>
              Full balance
            </button>
          </div>
        )}
        <Input label="Notes" name="notes" value={form.notes} onChange={(e) => set('notes', e.target.value)} placeholder="e.g. Second instalment after installation" />
      </div>
    </Modal>
  )
}
