import { useState } from 'react'
import {
  ShieldCheck,
  Search,
  Phone,
  FileText,
  AlertCircle,
  CheckCircle2,
  Wrench,
  Calendar,
  AlertTriangle,
  RotateCcw,
  Check,
  Package,
  Truck,
  Home,
  CheckCheck,
} from 'lucide-react'
import Navbar from './Navbar'
import Footer from './Footer'
import { trackOrder, reportProblem, confirmTicket } from '@/api/public'
import { formatCurrency, formatDate } from '@/utils/format'
import { Button, Input, Select, Textarea, Modal, Badge } from '@/components/ui'

// Frozen order statuses from brief
const ORDER_STEPS = [
  { key: 'quoted', label: 'Quoted', icon: FileText },
  { key: 'confirmed', label: 'Confirmed', icon: CheckCircle2 },
  { key: 'packed', label: 'Packed', icon: Package },
  { key: 'dispatched', label: 'Dispatched', icon: Truck },
  { key: 'delivered', label: 'Delivered', icon: Home },
  { key: 'installed', label: 'Installed', icon: Wrench },
  { key: 'closed', label: 'Completed', icon: CheckCheck },
]

export default function TrackOrder() {
  // Search inputs
  const [phone, setPhone] = useState('')
  const [orderId, setOrderId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Order data retrieved
  const [order, setOrder] = useState(null)

  // Report Problem Modal state (B3)
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedEquipment, setSelectedEquipment] = useState(null)
  const [reportForm, setReportForm] = useState({
    issueType: 'fault_code',
    faultCode: '',
    description: '',
    preferredDate: '',
  })
  const [submittingTicket, setSubmittingTicket] = useState(false)
  const [ticketSuccessMessage, setTicketSuccessMessage] = useState('')

  // Confirming ticket state
  const [confirmingTicketId, setConfirmingTicketId] = useState(null)

  // Search submission
  const handleSearch = async (e) => {
    e?.preventDefault()
    setError('')
    setOrder(null)

    if (!phone.trim() || !orderId.trim()) {
      setError('Please provide both your registered Phone Number and Order ID.')
      return
    }

    setLoading(true)
    try {
      const data = await trackOrder({ phone, orderId })
      setOrder(data)
    } catch (err) {
      setError(err.message || 'No matching order found. Please check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  // Pre-fill demo order SC-1042 for easy testing
  const fillDemoOrder = () => {
    setPhone('9876543210')
    setOrderId('SC-1042')
    setError('')
  }

  // Clear lookup
  const handleClearLookup = () => {
    setOrder(null)
    setPhone('')
    setOrderId('')
    setError('')
  }

  // Open problem modal for an equipment item
  const openReportModal = (item) => {
    setSelectedEquipment(item)
    setReportForm({
      issueType: 'fault_code',
      faultCode: '',
      description: '',
      preferredDate: '',
    })
    setTicketSuccessMessage('')
    setModalOpen(true)
  }

  // Submit problem ticket
  const handleReportSubmit = async (e) => {
    e.preventDefault()
    if (!selectedEquipment) return

    setSubmittingTicket(true)
    try {
      const res = await reportProblem({
        phone: order.phone || phone,
        orderId: order.orderId,
        serialUnitId: selectedEquipment.serialUnitId,
        issueType: reportForm.issueType,
        faultCode: reportForm.faultCode,
        description: reportForm.description,
        preferredDate: reportForm.preferredDate,
      })

      // Add newly created ticket to local view
      setOrder((prev) => ({
        ...prev,
        tickets: [
          {
            id: res.ticketNo,
            ticketNo: res.ticketNo,
            serialUnitId: selectedEquipment.serialUnitId,
            issue: reportForm.description || `Issue on ${selectedEquipment.product}`,
            status: 'open',
            createdAt: new Date().toISOString().slice(0, 10),
          },
          ...(prev.tickets || []),
        ],
      }))

      setTicketSuccessMessage(`Complaint logged successfully! Ticket #${res.ticketNo} has been assigned to our field service desk.`)
    } catch (err) {
      alert(err.message || 'Failed to submit problem ticket')
    } finally {
      setSubmittingTicket(false)
    }
  }

  // Handle "Yes, it works now" to close the loop
  const handleConfirmResolvedTicket = async (ticketId) => {
    setConfirmingTicketId(ticketId)
    try {
      await confirmTicket(ticketId)
      setOrder((prev) => ({
        ...prev,
        tickets: prev.tickets.map((t) =>
          t.id === ticketId || t.ticketNo === ticketId
            ? { ...t, status: 'confirmed' }
            : t,
        ),
      }))
    } catch (err) {
      alert(err.message || 'Failed to confirm ticket resolution')
    } finally {
      setConfirmingTicketId(null)
    }
  }

  // Determine current timeline step index
  const getCurrentStepIndex = () => {
    if (!order) return -1
    const idx = ORDER_STEPS.findIndex((s) => s.key === order.status)
    return idx >= 0 ? idx : 0
  }

  const currentStepIdx = getCurrentStepIndex()

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 antialiased selection:bg-primary-500 selection:text-white">
      <Navbar />

      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Page Title Header */}
        <div className="text-center">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-primary-100 px-3 py-1 text-xs font-semibold text-primary-700">
            <ShieldCheck className="h-4 w-4" />
            <span>Customer Self-Service Portal</span>
          </div>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Track My Order & Equipment Warranty
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Check live installation milestones, verify serial numbers, check 20-year warranty, or report a service issue.
          </p>
        </div>

        {/* ========================================================================= */}
        {/* LOOKUP SEARCH FORM                                                        */}
        {/* ========================================================================= */}
        {!order && (
          <div className="mx-auto mt-10 max-w-xl">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <h2 className="text-base font-bold text-slate-900">
                Enter Order Details to Track
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Found on your quotation, advance receipt, or invoice SMS.
              </p>

              {error && (
                <div className="mt-4 flex items-center gap-2 rounded-lg border border-danger-500/30 bg-danger-50 p-3 text-xs text-danger-700">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSearch} className="mt-6 space-y-4">
                <Input
                  label="Registered Mobile Phone Number"
                  name="phone"
                  type="tel"
                  placeholder="e.g. 9876543210"
                  icon={Phone}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />

                <Input
                  label="Order Reference ID"
                  name="orderId"
                  placeholder="e.g. SC-1042"
                  icon={FileText}
                  value={orderId}
                  onChange={(e) => setOrderId(e.target.value)}
                  required
                />

                <Button
                  type="submit"
                  fullWidth
                  size="lg"
                  loading={loading}
                  icon={Search}
                >
                  Track Order Progress
                </Button>
              </form>

              {/* Demo Helper Box for Judges */}
              <div className="mt-6 rounded-xl border border-dashed border-slate-300 bg-slate-50/70 p-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Hackathon Demo Shortcut
                  </span>
                  <button
                    type="button"
                    onClick={fillDemoOrder}
                    className="cursor-pointer text-xs font-bold text-primary-600 hover:text-primary-700 hover:underline"
                  >
                    Auto-Fill Demo Order
                  </button>
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  Phone: <code className="font-mono font-semibold text-slate-700">9876543210</code> · Order ID:{' '}
                  <code className="font-mono font-semibold text-slate-700">SC-1042</code> (Homeowner R. Sharma)
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* ORDER DETAILS & TRACKING RESULTS                                          */}
        {/* ========================================================================= */}
        {order && (
          <div className="mt-8 space-y-8">
            
            {/* Top Summary Card */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-5">
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-xl font-bold text-slate-900">
                      Order #{order.orderId}
                    </h2>
                    <Badge status={order.status} />
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    Customer: <strong className="text-slate-800">{order.customerName}</strong> · Package:{' '}
                    <strong className="text-slate-800">{order.kit}</strong>
                  </p>
                </div>

                <Button
                  variant="secondary"
                  size="sm"
                  icon={RotateCcw}
                  onClick={handleClearLookup}
                >
                  Check Another Order
                </Button>
              </div>

              {/* Financial Snapshot */}
              <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="rounded-xl bg-slate-50 p-4">
                  <span className="text-xs text-slate-500">Total Order Amount</span>
                  <p className="mt-1 text-lg font-bold text-slate-900">
                    {formatCurrency(order.total)}
                  </p>
                </div>
                <div className="rounded-xl bg-emerald-50 p-4">
                  <span className="text-xs text-emerald-700 font-medium">Amount Paid</span>
                  <p className="mt-1 text-lg font-bold text-emerald-700">
                    {formatCurrency(order.paid)}
                  </p>
                </div>
                <div className="rounded-xl bg-slate-50 p-4">
                  <span className="text-xs text-slate-500">Balance Due</span>
                  <p className="mt-1 text-lg font-bold text-slate-900">
                    {formatCurrency(order.balance)}
                  </p>
                </div>
              </div>

              {/* Order Status Timeline */}
              <div className="mt-8 pt-6 border-t border-slate-100">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Installation Milestones Timeline
                </h3>

                <div className="mt-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  {ORDER_STEPS.map((step, idx) => {
                    const isPassed = idx <= currentStepIdx
                    const isCurrent = idx === currentStepIdx
                    const StepIcon = step.icon

                    return (
                      <div key={step.key} className="flex flex-1 items-center">
                        <div className="flex flex-col items-center">
                          <div
                            className={`flex h-10 w-10 items-center justify-center rounded-full transition ${
                              isCurrent
                                ? 'bg-primary-600 text-white ring-4 ring-primary-100 shadow-md'
                                : isPassed
                                ? 'bg-emerald-500 text-white'
                                : 'bg-slate-100 text-slate-400'
                            }`}
                          >
                            <StepIcon className="h-5 w-5" />
                          </div>
                          <span
                            className={`mt-2 text-xs font-semibold ${
                              isCurrent
                                ? 'text-primary-600'
                                : isPassed
                                ? 'text-slate-900'
                                : 'text-slate-400'
                            }`}
                          >
                            {step.label}
                          </span>
                        </div>

                        {idx < ORDER_STEPS.length - 1 && (
                          <div
                            className={`hidden h-0.5 flex-1 md:block mx-2 ${
                              idx < currentStepIdx ? 'bg-emerald-500' : 'bg-slate-200'
                            }`}
                          />
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Installed Equipment & Serial Tracking */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Installed Equipment & Serial Tracking
                  </h3>
                  <p className="text-xs text-slate-500">
                    Serial numbers scanned at dispatch with real-time warranty validation.
                  </p>
                </div>
              </div>

              <div className="mt-5 divide-y divide-slate-100">
                {order.equipment?.map((item) => (
                  <div
                    key={item.serialUnitId}
                    className="flex flex-wrap items-center justify-between gap-4 py-4 first:pt-0 last:pb-0"
                  >
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{item.product}</h4>
                      <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                        <span>
                          Serial Number:{' '}
                          <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-slate-700">
                            {item.serialMasked}
                          </code>
                        </span>
                        <span>Warranty Ends: {formatDate(item.warrantyEnd)}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {item.underWarranty ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 ring-1 ring-emerald-500/20">
                          <Check className="h-3.5 w-3.5" /> Under Warranty
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-danger-50 px-2.5 py-1 text-xs font-medium text-danger-700 ring-1 ring-danger-500/20">
                          <AlertTriangle className="h-3.5 w-3.5" /> Expired
                        </span>
                      )}

                      <Button
                        variant="secondary"
                        size="sm"
                        icon={Wrench}
                        onClick={() => openReportModal(item)}
                      >
                        Report a Problem
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* My Service Complaints / Tickets */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="border-b border-slate-100 pb-4">
                <h3 className="text-base font-bold text-slate-900">Service Tickets</h3>
                <p className="text-xs text-slate-500">
                  Track repairs, technician dispatches, and confirm service completion.
                </p>
              </div>

              {order.tickets && order.tickets.length > 0 ? (
                <div className="mt-4 divide-y divide-slate-100">
                  {order.tickets.map((t) => (
                    <div
                      key={t.id || t.ticketNo}
                      className="flex flex-wrap items-center justify-between gap-4 py-4 first:pt-0 last:pb-0"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm font-bold text-slate-900">
                            #{t.ticketNo}
                          </span>
                          <Badge status={t.status} />
                        </div>
                        <p className="mt-1 text-xs text-slate-600">{t.issue}</p>
                      </div>

                      <div>
                        {t.status === 'resolved' && (
                          <Button
                            size="sm"
                            icon={Check}
                            loading={confirmingTicketId === (t.id || t.ticketNo)}
                            onClick={() => handleConfirmResolvedTicket(t.id || t.ticketNo)}
                            className="bg-emerald-600 hover:bg-emerald-700"
                          >
                            Yes, it works now!
                          </Button>
                        )}
                        {t.status === 'confirmed' && (
                          <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                            <CheckCircle2 className="h-4 w-4" /> Issue Closed & Confirmed
                          </span>
                        )}
                        {(t.status === 'open' || t.status === 'assigned') && (
                          <span className="text-xs text-slate-400">
                            In progress with service technician
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-4 text-xs text-slate-500">
                  No service tickets reported for this order. System is running healthy!
                </p>
              )}
            </div>

          </div>
        )}
      </main>

      {/* ========================================================================= */}
      {/* REPORT A PROBLEM MODAL (B3)                                               */}
      {/* ========================================================================= */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Report an Equipment Problem"
        description={selectedEquipment ? `Equipment: ${selectedEquipment.product} (${selectedEquipment.serialMasked})` : ''}
      >
        {ticketSuccessMessage ? (
          <div className="py-6 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <p className="mt-3 text-sm font-bold text-slate-900">{ticketSuccessMessage}</p>
            <div className="mt-6">
              <Button onClick={() => setModalOpen(false)}>Done</Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleReportSubmit} className="space-y-4">
            {selectedEquipment && (
              <div className="rounded-lg bg-slate-50 p-3 text-xs">
                <span className="text-slate-500">Warranty Status: </span>
                {selectedEquipment.underWarranty ? (
                  <span className="font-bold text-emerald-700">
                    Covered Under 20-Year Guarantee (Zero Repair Cost)
                  </span>
                ) : (
                  <span className="font-bold text-danger-700">
                    Expired (Parts & Labour will be quoted)
                  </span>
                )}
              </div>
            )}

            <Select
              label="Issue Category"
              name="issueType"
              value={reportForm.issueType}
              onChange={(e) =>
                setReportForm((prev) => ({ ...prev, issueType: e.target.value }))
              }
              options={[
                { value: 'fault_code', label: 'Fault Code on Inverter (e.g. E07)' },
                { value: 'no_power', label: 'Zero Power / Total Blackout' },
                { value: 'low_generation', label: 'Low Generation / Reduced Output' },
                { value: 'physical_damage', label: 'Physical Damage (Panel/Stand/Wire)' },
                { value: 'other', label: 'Other Operational Issue' },
              ]}
              required
            />

            {reportForm.issueType === 'fault_code' && (
              <Input
                label="Fault Code Displayed on Screen (Optional)"
                placeholder="e.g. E07 or F02"
                value={reportForm.faultCode}
                onChange={(e) =>
                  setReportForm((prev) => ({ ...prev, faultCode: e.target.value }))
                }
              />
            )}

            <Textarea
              label="Describe the Problem"
              placeholder="e.g. Inverter screen turned red with zero generation since morning rain..."
              rows={3}
              value={reportForm.description}
              onChange={(e) =>
                setReportForm((prev) => ({ ...prev, description: e.target.value }))
              }
              required
            />

            <Input
              label="Preferred Visit Date (Optional)"
              type="date"
              icon={Calendar}
              value={reportForm.preferredDate}
              onChange={(e) =>
                setReportForm((prev) => ({ ...prev, preferredDate: e.target.value }))
              }
            />

            <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-slate-100">
              <Button
                variant="secondary"
                type="button"
                onClick={() => setModalOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" loading={submittingTicket}>
                Submit Complaint
              </Button>
            </div>
          </form>
        )}
      </Modal>

      <Footer />
    </div>
  )
}
