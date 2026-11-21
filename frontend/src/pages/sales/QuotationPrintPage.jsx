// Printable quotation (browser print → "Save as PDF"). Only the document area is printed.
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import PageShell from './PageShell'
import { Button, Card, Badge } from './ui'
import { quotationsApi, customersApi } from '@/api/sales'
import { formatCurrency, formatDate, systemTypeLabel } from './salesHelpers'

const PRINT_CSS = `
@media print {
  @page { size: A4; margin: 14mm; }
  body * { visibility: hidden !important; }
  #quote-doc, #quote-doc * { visibility: visible !important; }
  #quote-doc { position: absolute; inset: 0 auto auto 0; width: 100%; border: 0 !important; box-shadow: none !important; }
}`

export default function QuotationPrintPage() {
  const { id } = useParams()
  const [quote, setQuote] = useState(null)
  const [customer, setCustomer] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const res = await quotationsApi.getQuotationById(id)
      const q = res?.data || null
      setQuote(q)
      if (q?.customerId) {
        const c = await customersApi.getCustomerById(q.customerId)
        setCustomer(c?.data || null)
      }
      setLoading(false)
    }
    load()
  }, [id])

  if (loading) {
    return <PageShell title="Quotation"><Card><p className="text-sm text-slate-500">Loading…</p></Card></PageShell>
  }
  if (!quote) {
    return (
      <PageShell title="Quotation not found" breadcrumbs={[{ label: 'Quotations', path: '/sales/quotations' }, { label: 'Not found' }]}>
        <Card><Link to="/sales/quotations" className="text-sm font-semibold text-amber-700">Back to quotations</Link></Card>
      </PageShell>
    )
  }

  const validUntil = new Date(new Date(quote.createdAt).getTime() + 15 * 24 * 3600 * 1000)

  return (
    <PageShell
      title={quote.quotationNumber}
      subtitle={`${quote.customerName} · ${quote.systemCapacityKw} kW ${systemTypeLabel(quote.systemType)}`}
      breadcrumbs={[{ label: 'Quotations', path: '/sales/quotations' }, { label: quote.quotationNumber }]}
      actions={
        <>
          {quote.status === 'draft' && (
            <Link to={`/sales/quotations/${quote.id}/edit`}><Button variant="outline">Edit</Button></Link>
          )}
          <Button onClick={() => window.print()}>Print / Save PDF</Button>
        </>
      }
    >
      <style>{PRINT_CSS}</style>
      <div id="quote-doc" className="mx-auto max-w-4xl rounded-xl border border-slate-200 bg-white p-8 text-slate-800 shadow-xs">
        <header className="flex flex-col gap-6 border-b border-slate-200 pb-6 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500 text-lg font-bold text-white">☀</span>
              <span className="text-xl font-bold tracking-tight text-slate-900">SolarConnect</span>
            </div>
            <p className="mt-2 text-xs text-slate-500">Rooftop solar design, supply &amp; installation</p>
          </div>
          <div className="text-left sm:text-right">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">Quotation</div>
            <div className="text-lg font-bold text-slate-900">{quote.quotationNumber}</div>
            <div className="mt-1 text-xs text-slate-500">Date: {formatDate(quote.createdAt)}</div>
            <div className="text-xs text-slate-500">Valid until: {formatDate(validUntil)}</div>
            <div className="mt-2"><Badge statusKey={quote.status} size="sm">{quote.status}</Badge></div>
          </div>
        </header>

        <section className="grid grid-cols-1 gap-6 border-b border-slate-200 py-6 sm:grid-cols-2">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">Prepared for</div>
            <div className="mt-1 font-semibold text-slate-900">{quote.customerName}</div>
            {customer?.address && <div className="text-sm text-slate-600">{customer.address}</div>}
            <div className="text-sm text-slate-600">{customer?.phone || quote.customerPhone}</div>
            {customer?.email && <div className="text-sm text-slate-600">{customer.email}</div>}
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">Proposed system</div>
            <div className="mt-1 font-semibold text-slate-900">
              {quote.systemCapacityKw} kW {systemTypeLabel(quote.systemType)} rooftop solar
            </div>
            {customer?.monthlyBill > 0 && (
              <div className="text-sm text-slate-600">Current monthly electricity bill: {formatCurrency(customer.monthlyBill)}</div>
            )}
          </div>
        </section>

        <table className="mt-6 w-full text-sm">
          <thead>
            <tr className="border-b border-slate-300 text-left text-xs uppercase tracking-wider text-slate-500">
              <th className="py-2 pr-2">#</th>
              <th className="py-2 pr-2">Item</th>
              <th className="py-2 pr-2 text-right">Qty</th>
              <th className="py-2 pr-2 text-right">Unit price</th>
              <th className="py-2 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {(quote.lines || []).map((l, i) => (
              <tr key={`${l.productId}-${i}`} className="border-b border-slate-100">
                <td className="py-2 pr-2 text-slate-400">{i + 1}</td>
                <td className="py-2 pr-2">{l.productName}</td>
                <td className="py-2 pr-2 text-right">{l.qty}</td>
                <td className="py-2 pr-2 text-right">{formatCurrency(l.unitPrice)}</td>
                <td className="py-2 text-right font-medium">{formatCurrency(l.total ?? l.qty * l.unitPrice)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-6 flex justify-end">
          <dl className="w-full max-w-xs space-y-1.5 text-sm">
            <div className="flex justify-between"><dt className="text-slate-500">Subtotal</dt><dd>{formatCurrency(quote.subtotal)}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">GST ({quote.gstRate}%)</dt><dd>{formatCurrency(quote.gstAmount)}</dd></div>
            {quote.discount > 0 && (
              <div className="flex justify-between"><dt className="text-slate-500">Discount</dt><dd>− {formatCurrency(quote.discount)}</dd></div>
            )}
            <div className="flex justify-between border-t border-slate-300 pt-2 text-base font-bold text-slate-900">
              <dt>Grand total</dt><dd>{formatCurrency(quote.grandTotal)}</dd>
            </div>
          </dl>
        </div>

        {quote.notes && (
          <section className="mt-8 rounded-lg bg-slate-50 p-4 text-sm text-slate-600">
            <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-400">Terms &amp; notes</div>
            {quote.notes}
          </section>
        )}

        <footer className="mt-10 grid grid-cols-2 gap-8 text-xs text-slate-500">
          <div className="border-t border-slate-300 pt-2">For SolarConnect (authorised signatory)</div>
          <div className="border-t border-slate-300 pt-2 text-right">Customer acceptance</div>
        </footer>
      </div>
    </PageShell>
  )
}
