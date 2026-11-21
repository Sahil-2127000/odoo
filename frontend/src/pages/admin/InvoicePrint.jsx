// /invoice/:type/:id - a printable invoice. "Print / Save as PDF" uses the browser's own print dialog.
// type is "order" (product sale) or "repair" (out-of-warranty repair bill).
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Printer, Sun } from 'lucide-react'
import { Button, Loader } from '@/components/ui'
import { getInvoice } from '@/api/invoices'
import { statusLabel } from '@/constants/status'
import { formatCurrency, formatDate } from '@/utils/format'

const GST_RATE = 0.18 // order totals include 18% GST (9% CGST + 9% SGST)

export default function InvoicePrint() {
  const { type, id } = useParams()
  const [doc, setDoc] = useState(undefined) // undefined = loading, null = not found
  const [error, setError] = useState('')

  useEffect(() => {
    getInvoice(type, id)
      .then(setDoc)
      .catch((err) => setError(err.message))
  }, [type, id])

  if (error) return <Message text={error} />
  if (doc === undefined) return <Loader fullPage label="Loading invoice..." />
  if (doc === null) return <Message text="Invoice not found." />

  const isOrder = type === 'order'

  // Lines on the invoice
  const lines = isOrder
    ? doc.items.map((i) => ({ name: i.product?.name ?? 'Product', qty: i.qty, rate: i.price, amount: i.qty * i.price }))
    : [{ name: `Repair: ${doc.issue}`, qty: 1, rate: doc.billAmount, amount: doc.billAmount }]

  // For orders the total already includes GST, so split it back out
  const total = isOrder ? doc.total : doc.billAmount
  const paid = isOrder ? doc.amountPaid : 0 // repair payments are not recorded by the backend yet
  const subtotal = isOrder ? Math.round(total / (1 + GST_RATE)) : total
  const gst = total - subtotal
  const cgst = Math.round(gst / 2) // GST is split half and half
  const sgst = gst - cgst
  const balance = total - paid

  return (
    <div className="min-h-screen bg-slate-100 py-8 print:bg-white print:py-0">
      {/* Buttons are hidden when printing */}
      <div className="mx-auto mb-4 flex max-w-3xl justify-end gap-2 px-4 print:hidden">
        <Button variant="secondary" onClick={() => window.close()}>
          Close
        </Button>
        <Button icon={Printer} onClick={() => window.print()}>
          Print / Save as PDF
        </Button>
      </div>

      <div className="mx-auto max-w-3xl bg-white p-8 shadow-card sm:p-10 print:max-w-none print:shadow-none">
        {/* Header: company + invoice number */}
        <div className="flex flex-col justify-between gap-6 border-b border-slate-200 pb-6 sm:flex-row">
          <div>
            <div className="flex items-center gap-2">
              <Sun className="h-7 w-7 text-amber-500" />
              <span className="font-display text-2xl font-extrabold tracking-wide uppercase">SolarConnect</span>
            </div>
            <p className="mt-2 text-sm text-slate-500">
              Solar Tech Park, New Delhi
              <br />
              +91 98765 43210 · hello@solarconnect.example
            </p>
          </div>
          <div className="sm:text-right">
            <h1 className="text-2xl font-semibold text-slate-900">{isOrder ? 'Tax Invoice' : 'Repair Bill'}</h1>
            <p className="mt-1 text-sm text-slate-600">No. {doc.code}</p>
            <p className="text-sm text-slate-600">Date: {formatDate(doc.createdAt)}</p>
            <p className="text-sm text-slate-600">Status: {statusLabel(doc.status)}</p>
          </div>
        </div>

        {/* Bill to */}
        <div className="grid gap-6 py-6 sm:grid-cols-2">
          <div>
            <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">Bill to</p>
            <p className="mt-1 font-medium text-slate-900">{doc.customer?.name}</p>
            <p className="text-sm text-slate-600">{doc.customer?.address}</p>
            <p className="text-sm text-slate-600">Phone: {doc.customer?.phone}</p>
          </div>
          {!isOrder && (
            <div>
              <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">For order</p>
              <p className="mt-1 font-medium text-slate-900">{doc.order?.code}</p>
              <p className="text-sm text-slate-600">This repair was not covered by warranty.</p>
            </div>
          )}
        </div>

        {/* Lines */}
        <table className="w-full text-sm">
          <thead>
            <tr className="border-y border-slate-200 text-left text-xs tracking-wide text-slate-500 uppercase">
              <th className="py-2">Item</th>
              <th className="py-2 text-right">Qty</th>
              <th className="py-2 text-right">Rate</th>
              <th className="py-2 text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {lines.map((line, i) => (
              <tr key={i}>
                <td className="py-2.5 pr-4 text-slate-800">{line.name}</td>
                <td className="py-2.5 text-right">{line.qty}</td>
                <td className="py-2.5 text-right">{formatCurrency(line.rate)}</td>
                <td className="py-2.5 text-right">{formatCurrency(line.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="mt-6 ml-auto max-w-xs space-y-1.5 text-sm">
          {isOrder && (
            <>
              <Row label="Subtotal" value={formatCurrency(subtotal)} />
              <Row label="CGST 9%" value={formatCurrency(cgst)} />
              <Row label="SGST 9%" value={formatCurrency(sgst)} />
            </>
          )}
          <div className="flex justify-between border-t border-slate-200 pt-2 text-base font-semibold text-slate-900">
            <span>Total</span>
            <span>{formatCurrency(total)}</span>
          </div>
          <Row label="Paid" value={formatCurrency(paid)} />
          <div className="flex justify-between font-semibold">
            <span>Balance due</span>
            <span className={balance > 0 ? 'text-danger-700' : 'text-success-700'}>{formatCurrency(balance)}</span>
          </div>
        </div>

        <p className="mt-10 border-t border-slate-200 pt-4 text-center text-xs text-slate-500">
          Thank you for choosing SolarConnect. Track your order any time at solarconnect.example/track
        </p>
      </div>
    </div>
  )
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between text-slate-600">
      <span>{label}</span>
      <span>{value}</span>
    </div>
  )
}

function Message({ text }) {
  return <div className="flex min-h-screen items-center justify-center text-slate-600">{text}</div>
}
