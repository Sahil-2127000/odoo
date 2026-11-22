// /track - customers check their order with phone number + order code (no login).
// They can see the status timeline and warranty of each item, report a problem
// after installation, and confirm that a resolved repair works.
import { useState } from 'react'
import {
  AlertCircle,
  AlertTriangle,
  Check,
  CheckCircle2,
  CreditCard,
  FileText,
  Home,
  Package,
  Phone,
  RotateCcw,
  Search,
  ShieldCheck,
  Truck,
  Wrench,
} from 'lucide-react'
import Navbar from './Navbar'
import Footer from './Footer'
import { confirmTicket, createPayment, reportProblem, trackOrder, verifyPayment } from '@/api/public'
import { formatCurrency, formatDate } from '@/utils/format'
import { Badge, Button, Input, Modal, Select, Textarea } from '@/components/ui'

// Order statuses from the backend, in order
const ORDER_STEPS = [
  { key: 'quoted', label: 'Quoted', icon: FileText },
  { key: 'confirmed', label: 'Confirmed', icon: CheckCircle2 },
  { key: 'packed', label: 'Packed', icon: Package },
  { key: 'dispatched', label: 'Dispatched', icon: Truck },
  { key: 'delivered', label: 'Delivered', icon: Home },
  { key: 'installed', label: 'Installed', icon: Wrench },
]

const ISSUE_TYPES = [
  { value: 'Inverter shows an error code', label: 'Error code on inverter (e.g. E07)' },
  { value: 'No power from the system', label: 'No power at all' },
  { value: 'Low generation', label: 'Low generation / less output' },
  { value: 'Physical damage', label: 'Physical damage (panel, stand, wire)' },
  { value: 'Other problem', label: 'Other problem' },
]

// Warranty is valid if its end date is in the future (no end date = not installed yet)
const isUnderWarranty = (item) => Boolean(item.warrantyEnd) && new Date(item.warrantyEnd) > new Date()

// Loads Razorpay's checkout script once, the first time someone clicks "Pay now"
function loadRazorpay() {
  if (window.Razorpay) return Promise.resolve()
  return new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload = resolve
    script.onerror = () => reject(new Error('Could not load the payment page. Check your internet and try again.'))
    document.body.appendChild(script)
  })
}

export default function TrackOrder() {
  // Lookup form
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [order, setOrder] = useState(null)

  // Tickets raised or confirmed in this visit
  const [tickets, setTickets] = useState([])

  // Report a problem pop-up
  const [reportItem, setReportItem] = useState(null) // the item the customer clicked
  const [report, setReport] = useState({ issueType: ISSUE_TYPES[0].value, details: '' })
  const [reportError, setReportError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [newTicket, setNewTicket] = useState(null) // ticket returned by the backend

  // Pay the pending balance online
  const [payAmount, setPayAmount] = useState('')
  const [paying, setPaying] = useState(false)
  const [payMessage, setPayMessage] = useState({ type: '', text: '' })

  // Confirm a repair form
  const [confirmCode, setConfirmCode] = useState('')
  const [confirmMessage, setConfirmMessage] = useState({ type: '', text: '' })
  const [confirming, setConfirming] = useState(false)

  async function handleSearch(e) {
    e.preventDefault()
    setError('')
    if (!/^\d{10}$/.test(phone)) return setError('Enter your 10-digit registered phone number.')
    if (!code.trim()) return setError('Enter your order code, e.g. OR-1001.')

    setLoading(true)
    try {
      const found = await trackOrder({ phone, code })
      setOrder(found)
      setPayAmount(String(found.total - found.amountPaid)) // suggest paying the full balance
    } catch (err) {
      setError(err.message) // e.g. "No order found for this phone and order code"
    } finally {
      setLoading(false)
    }
  }

  // "Check another order" clears everything (the lookup is kept only in page state)
  function handleClear() {
    setOrder(null)
    setPhone('')
    setCode('')
    setError('')
    setTickets([])
    setConfirmCode('')
    setConfirmMessage({ type: '', text: '' })
    setPayAmount('')
    setPayMessage({ type: '', text: '' })
  }

  // 1) backend creates a Razorpay order  2) Razorpay pop-up takes the payment
  // 3) backend verifies it and adds it to the order
  async function handlePay(e) {
    e.preventDefault()
    const amount = Number(payAmount)
    if (!(amount > 0)) return setPayMessage({ type: 'error', text: 'Enter an amount to pay.' })

    setPaying(true)
    setPayMessage({ type: '', text: '' })
    try {
      await loadRazorpay()
      const rzpOrder = await createPayment({ phone, orderCode: order.code, amount })

      const checkout = new window.Razorpay({
        key: rzpOrder.key,
        amount: rzpOrder.amount, // in paise
        currency: rzpOrder.currency,
        order_id: rzpOrder.razorpayOrderId,
        name: 'SolarConnect',
        description: `Payment for order ${rzpOrder.orderCode}`,
        prefill: { name: rzpOrder.customerName, contact: phone },
        theme: { color: '#ea580c' },
        handler: async (response) => {
          try {
            const result = await verifyPayment(response)
            setOrder((o) => ({ ...o, amountPaid: o.total - result.pending }))
            setPayAmount(String(result.pending))
            setPayMessage({ type: 'success', text: `Payment of ${formatCurrency(result.paid)} received. Thank you!` })
          } catch (err) {
            setPayMessage({ type: 'error', text: err.message })
          } finally {
            setPaying(false)
          }
        },
        modal: { ondismiss: () => setPaying(false) }, // customer closed the pop-up
      })
      checkout.open()
    } catch (err) {
      setPayMessage({ type: 'error', text: err.message })
      setPaying(false)
    }
  }

  function openReport(item) {
    setReportItem(item)
    setReport({ issueType: ISSUE_TYPES[0].value, details: '' })
    setReportError('')
    setNewTicket(null)
  }

  async function handleReportSubmit(e) {
    e.preventDefault()
    if (!report.details.trim()) return setReportError('Please describe the problem.')

    setSubmitting(true)
    setReportError('')
    try {
      // The backend takes one "issue" text, so we combine the item, type and description
      const ticket = await reportProblem({
        phone,
        orderCode: order.code,
        issue: `${reportItem.name}: ${report.issueType}. ${report.details.trim()}`,
      })
      setNewTicket(ticket)
      setTickets((list) => [ticket, ...list])
    } catch (err) {
      setReportError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleConfirm(ticketCode) {
    setConfirming(true)
    setConfirmMessage({ type: '', text: '' })
    try {
      const ticket = await confirmTicket({ phone, code: ticketCode })
      setConfirmMessage({ type: 'success', text: `Thank you! Ticket ${ticket.code} is now closed.` })
      setConfirmCode('')
      // update the ticket if it is in the list, otherwise add it
      setTickets((list) =>
        list.some((t) => t.code === ticket.code) ? list.map((t) => (t.code === ticket.code ? ticket : t)) : [ticket, ...list],
      )
    } catch (err) {
      setConfirmMessage({ type: 'error', text: err.message })
    } finally {
      setConfirming(false)
    }
  }

  const currentStep = order ? ORDER_STEPS.findIndex((s) => s.key === order.status) : -1
  const isInstalled = order?.status === 'installed'

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 antialiased">
      <Navbar />

      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="text-center">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-primary-100 px-3 py-1 text-xs font-semibold text-primary-700">
            <ShieldCheck className="h-4 w-4" />
            <span>Customer self-service</span>
          </div>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">Track my order & warranty</h1>
          <p className="mt-2 text-sm text-slate-600">
            See where your installation is, check the warranty of each item, or report a problem.
          </p>
        </div>

        {/* ---------- Lookup form ---------- */}
        {!order && (
          <div className="mx-auto mt-10 max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <h2 className="text-base font-bold text-slate-900">Enter your order details</h2>
            <p className="mt-1 text-xs text-slate-500">The order code is printed on your quote and invoice.</p>

            {error && (
              <div className="mt-4 flex items-center gap-2 rounded-lg border border-danger-500/30 bg-danger-50 p-3 text-sm text-danger-700">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSearch} className="mt-6 space-y-4" noValidate>
              <Input
                label="Registered phone number"
                type="tel"
                inputMode="numeric"
                placeholder="e.g. 9815488213"
                icon={Phone}
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                required
              />
              <Input
                label="Order code"
                placeholder="e.g. OR-1001"
                icon={FileText}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
              />
              <Button type="submit" fullWidth size="lg" loading={loading} icon={Search}>
                Track order
              </Button>
            </form>
          </div>
        )}

        {/* ---------- Results ---------- */}
        {order && (
          <div className="mt-8 space-y-8">
            {/* Summary + timeline */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-5">
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-xl font-bold text-slate-900">Order {order.code}</h2>
                    <Badge status={order.status} />
                  </div>
                  <p className="mt-1 text-sm text-slate-500">
                    Customer: <strong className="text-slate-800">{order.customerName}</strong>
                    {order.systemType && (
                      <>
                        {' '}
                        · System:{' '}
                        <strong className="text-slate-800">
                          {order.capacityKw} kW {order.systemType === 'off_grid' ? 'Off-Grid' : 'On-Grid'}
                        </strong>
                      </>
                    )}
                    {order.installedAt && <> · Installed on {formatDate(order.installedAt)}</>}
                  </p>
                </div>
                <Button variant="secondary" size="sm" icon={RotateCcw} onClick={handleClear}>
                  Check another order
                </Button>
              </div>

              <h3 className="mt-6 text-xs font-bold tracking-wider text-slate-500 uppercase">Progress</h3>
              <div className="mt-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                {ORDER_STEPS.map((step, idx) => {
                  const done = idx <= currentStep
                  const current = idx === currentStep
                  const StepIcon = step.icon
                  return (
                    <div key={step.key} className="flex flex-1 items-center">
                      <div className="flex flex-col items-center">
                        <div
                          className={`flex h-10 w-10 items-center justify-center rounded-full ${
                            current
                              ? 'bg-primary-600 text-white ring-4 ring-primary-100'
                              : done
                                ? 'bg-emerald-500 text-white'
                                : 'bg-slate-100 text-slate-400'
                          }`}
                        >
                          <StepIcon className="h-5 w-5" />
                        </div>
                        <span
                          className={`mt-2 text-xs font-semibold ${
                            current ? 'text-primary-600' : done ? 'text-slate-900' : 'text-slate-400'
                          }`}
                        >
                          {step.label}
                        </span>
                      </div>
                      {idx < ORDER_STEPS.length - 1 && (
                        <div className={`mx-2 hidden h-0.5 flex-1 md:block ${idx < currentStep ? 'bg-emerald-500' : 'bg-slate-200'}`} />
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Payment: pay the advance or the balance online (Razorpay) */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-base font-bold text-slate-900">Payment</h3>
              <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="text-xs text-slate-500">Total</p>
                  <p className="mt-1 font-bold text-slate-900">{formatCurrency(order.total)}</p>
                </div>
                <div className="rounded-xl bg-emerald-50 p-3">
                  <p className="text-xs text-emerald-700">Paid</p>
                  <p className="mt-1 font-bold text-emerald-700">{formatCurrency(order.amountPaid)}</p>
                </div>
                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="text-xs text-slate-500">Balance due</p>
                  <p className="mt-1 font-bold text-slate-900">{formatCurrency(order.total - order.amountPaid)}</p>
                </div>
              </div>

              {order.status === 'quoted' ? (
                <p className="mt-4 text-sm text-slate-500">You can pay once our team confirms your quote.</p>
              ) : order.total - order.amountPaid > 0 ? (
                <form onSubmit={handlePay} className="mt-4 flex flex-wrap items-end gap-3" noValidate>
                  <Input
                    label="Amount to pay (₹)"
                    type="number"
                    value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value)}
                    className="w-48"
                  />
                  <Button type="submit" icon={CreditCard} loading={paying}>
                    Pay now
                  </Button>
                </form>
              ) : (
                <p className="mt-4 text-sm font-medium text-emerald-700">Fully paid. Thank you!</p>
              )}

              {payMessage.text && (
                <p className={`mt-3 text-sm ${payMessage.type === 'success' ? 'text-emerald-700' : 'text-danger-700'}`}>
                  {payMessage.text}
                </p>
              )}
            </div>

            {/* Equipment + warranty */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="border-b border-slate-100 pb-4">
                <h3 className="text-base font-bold text-slate-900">Your equipment & warranty</h3>
                <p className="text-xs text-slate-500">
                  {isInstalled
                    ? 'Warranty started on the installation date.'
                    : 'Warranty starts on the day your system is installed.'}
                </p>
              </div>

              <div className="mt-5 divide-y divide-slate-100">
                {order.items.map((item) => (
                  <div key={item.name} className="flex flex-wrap items-center justify-between gap-4 py-4 first:pt-0 last:pb-0">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">
                        {item.name} <span className="font-normal text-slate-500">× {item.qty}</span>
                      </h4>
                      <p className="mt-1 text-xs text-slate-500">
                        {item.warrantyYears}-year warranty
                        {item.warrantyEnd && <> · ends {formatDate(item.warrantyEnd)}</>}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      {!item.warrantyEnd ? (
                        <Badge tone="gray">Starts at installation</Badge>
                      ) : isUnderWarranty(item) ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 ring-1 ring-emerald-500/20">
                          <Check className="h-3.5 w-3.5" /> Under warranty
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-danger-50 px-2.5 py-1 text-xs font-medium text-danger-700 ring-1 ring-danger-500/20">
                          <AlertTriangle className="h-3.5 w-3.5" /> Expired
                        </span>
                      )}

                      {/* Complaints can only be raised after installation (backend rule) */}
                      {isInstalled && (
                        <Button variant="secondary" size="sm" icon={Wrench} onClick={() => openReport(item)}>
                          Report a problem
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tickets + confirm a repair */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="border-b border-slate-100 pb-4">
                <h3 className="text-base font-bold text-slate-900">Service tickets</h3>
                <p className="text-xs text-slate-500">
                  Did our technician fix your problem? Enter the ticket number to confirm it works.
                </p>
              </div>

              {tickets.length > 0 && (
                <div className="mt-4 divide-y divide-slate-100">
                  {tickets.map((t) => (
                    <div key={t.code} className="flex flex-wrap items-center justify-between gap-4 py-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm font-bold text-slate-900">{t.code}</span>
                          <Badge status={t.status} />
                        </div>
                        <p className="mt-1 text-xs text-slate-600">{t.issue}</p>
                      </div>
                      <span className="text-xs text-slate-500">
                        {t.underWarranty ? 'Free (under warranty)' : `Charge: ${formatCurrency(t.billAmount)}`}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  if (confirmCode.trim()) handleConfirm(confirmCode)
                }}
                className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end"
              >
                <Input
                  className="sm:max-w-xs sm:flex-1"
                  label="Ticket number"
                  placeholder="e.g. TK-1001"
                  value={confirmCode}
                  onChange={(e) => setConfirmCode(e.target.value)}
                />
                <Button type="submit" icon={Check} loading={confirming} disabled={!confirmCode.trim()}>
                  Yes, it works now
                </Button>
              </form>
              {confirmMessage.text && (
                <p className={`mt-3 text-sm ${confirmMessage.type === 'success' ? 'text-emerald-700' : 'text-danger-700'}`}>
                  {confirmMessage.text}
                </p>
              )}
            </div>
          </div>
        )}
      </main>

      {/* ---------- Report a problem pop-up ---------- */}
      <Modal
        open={Boolean(reportItem)}
        onClose={() => setReportItem(null)}
        title="Report a problem"
        description={reportItem ? `${reportItem.name} · order ${order?.code}` : ''}
      >
        {newTicket ? (
          <div className="py-6 text-center">
            <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600" />
            <p className="mt-3 text-sm font-bold text-slate-900">Complaint registered. Your ticket number is {newTicket.code}.</p>
            <p className="mt-1 text-sm text-slate-600">
              {newTicket.underWarranty
                ? 'Your system is under warranty, so this repair is free.'
                : `Your warranty has ended, so a repair charge of ${formatCurrency(newTicket.billAmount)} applies.`}
            </p>
            <Button className="mt-6" onClick={() => setReportItem(null)}>
              Done
            </Button>
          </div>
        ) : (
          <form onSubmit={handleReportSubmit} className="space-y-4" noValidate>
            {reportError && <p className="rounded-lg bg-danger-50 px-3 py-2 text-sm text-danger-700">{reportError}</p>}
            {reportItem && (
              <p className="rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
                Warranty:{' '}
                {isUnderWarranty(reportItem) ? (
                  <b className="text-emerald-700">covered, the repair is free</b>
                ) : (
                  <b className="text-danger-700">expired, a repair charge applies</b>
                )}
              </p>
            )}
            <Select
              label="What is wrong?"
              value={report.issueType}
              onChange={(e) => setReport({ ...report, issueType: e.target.value })}
              options={ISSUE_TYPES}
            />
            <Textarea
              label="Describe the problem"
              placeholder="e.g. Inverter screen shows E07 and no power since this morning"
              rows={3}
              value={report.details}
              onChange={(e) => setReport({ ...report, details: e.target.value })}
              required
            />
            <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
              <Button variant="secondary" onClick={() => setReportItem(null)}>
                Cancel
              </Button>
              <Button type="submit" loading={submitting}>
                Submit complaint
              </Button>
            </div>
          </form>
        )}
      </Modal>

      <Footer />
    </div>
  )
}
