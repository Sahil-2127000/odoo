import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { getSerialItems, lookupSerial } from '../../api/operations'
import OpsPageShell from './components/OpsPageShell'
import { Badge, Button, inputClass } from './components/ui'
import { useApiData } from './useApiData'
import { formatDate, formatWarranty, labelize, SERIAL_STATUS_TONE, warrantyTimeLeft } from './utils'

// A few real serials to click in the demo: expired warranty, active warranty with a ticket, reserved, in stock.
const loadExamples = async () => {
  const all = await getSerialItems()
  const pick = (fn) => all.find(fn)
  return [
    pick((s) => s.warranty?.status === 'expired'),
    pick((s) => s.warranty?.status === 'active' && s.product?.category === 'inverter'),
    pick((s) => s.status === 'reserved'),
    pick((s) => s.status === 'in_stock' && s.product?.category === 'battery'),
  ].filter(Boolean)
}

const JOURNEY = ['in_stock', 'reserved', 'installed']
const JOURNEY_LABEL = { in_stock: 'In warehouse', reserved: 'Reserved for order', installed: 'Installed at site' }

function Journey({ status }) {
  if (status === 'defective') return <Badge tone="red">Marked defective - out of circulation</Badge>
  const reached = JOURNEY.indexOf(status)
  return (
    <ol className="flex flex-wrap items-center gap-2 text-xs">
      {JOURNEY.map((step, i) => (
        <li key={step} className="flex items-center gap-2">
          <span
            className={`flex h-6 w-6 items-center justify-center rounded-full font-semibold ${
              i <= reached ? 'bg-amber-500 text-white' : 'bg-slate-200 text-slate-500'
            }`}
          >
            {i + 1}
          </span>
          <span className={i <= reached ? 'font-medium text-slate-900' : 'text-slate-500'}>{JOURNEY_LABEL[step]}</span>
          {i < JOURNEY.length - 1 && <span className={`h-px w-8 ${i < reached ? 'bg-amber-500' : 'bg-slate-300'}`} />}
        </li>
      ))}
    </ol>
  )
}

function Section({ title, children, empty }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</h3>
      <div className="mt-2 text-sm text-slate-700">{children ?? <p className="text-slate-400">{empty}</p>}</div>
    </section>
  )
}

function Row({ label, children }) {
  return (
    <div className="flex justify-between gap-4 py-0.5">
      <span className="text-slate-500">{label}</span>
      <span className="text-right text-slate-900">{children}</span>
    </div>
  )
}

function Trace({ item }) {
  const { product, customer, order, installation, warranty, tickets } = item
  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-slate-200 bg-white p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="font-mono text-lg font-semibold text-slate-900">{item.serialNumber}</p>
            <p className="text-sm text-slate-600">
              {product.name} · {product.brand}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge tone={SERIAL_STATUS_TONE[item.status]}>{labelize(item.status)}</Badge>
            {warranty && <Badge tone={warranty.status === 'active' ? 'green' : 'red'}>Warranty {warranty.status}</Badge>}
          </div>
        </div>
        <div className="mt-4">
          <Journey status={item.status} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Section title="Product">
          <Row label="SKU">
            <span className="font-mono text-xs">{product.sku}</span>
          </Row>
          <Row label="Category">{labelize(product.category)}</Row>
          <Row label="Warranty period">{formatWarranty(product.warrantyMonths)}</Row>
          <Row label="Warehouse">{item.warehouse}</Row>
          <Row label="Stocked in">{formatDate(item.stockInDate)}</Row>
          {item.notes && <Row label="Notes">{item.notes}</Row>}
        </Section>

        <Section title="Customer" empty="Not assigned to a customer yet.">
          {customer && (
            <>
              <p className="font-medium text-slate-900">{customer.name}</p>
              <p>{customer.phone}</p>
              <p className="text-slate-500">{customer.address}</p>
            </>
          )}
        </Section>

        <Section title="Order" empty="Not linked to an order yet.">
          {order && (
            <>
              <Row label="Order">{order.orderNumber}</Row>
              <Row label="System">
                {order.systemSizeKw} kW {labelize(order.systemType)}
              </Row>
              <Row label="Order status">{labelize(order.status)}</Row>
            </>
          )}
        </Section>

        <Section title="Installation" empty="Not scheduled for installation yet.">
          {installation && (
            <>
              <Row label="Job">{installation.installationNumber}</Row>
              <Row label="Status">
                <Badge tone={installation.status === 'completed' ? 'green' : 'blue'}>{labelize(installation.status)}</Badge>
              </Row>
              <Row label="Scheduled">{formatDate(installation.scheduledDate)}</Row>
              {installation.completedAt && <Row label="Completed">{formatDate(installation.completedAt)}</Row>}
              <Row label="Crew">{installation.technicians.map((t) => t.name).join(', ')}</Row>
            </>
          )}
        </Section>

        <Section title="Warranty" empty="Starts automatically when the installation is completed.">
          {warranty && (
            <>
              <Row label="Warranty no.">{warranty.warrantyNumber}</Row>
              <Row label="Start">{formatDate(warranty.startDate)}</Row>
              <Row label="End">{formatDate(warranty.endDate)}</Row>
              <p className={`mt-2 rounded-md px-3 py-2 text-sm font-medium ${warranty.status === 'active' ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-700'}`}>
                {warranty.status === 'active' ? 'Under warranty: repair or replacement is free' : 'Out of warranty: parts and labour are billable'} ·{' '}
                {warrantyTimeLeft(warranty.endDate)}
              </p>
            </>
          )}
        </Section>

        <Section title={`Service tickets (${tickets.length})`} empty="No service tickets for this unit.">
          {tickets.length > 0 && (
            <ul className="divide-y divide-slate-100">
              {tickets.map((t) => (
                <li key={t._id} className="flex items-center justify-between gap-2 py-1.5">
                  <span>
                    <span className="font-mono text-xs text-slate-500">{t.ticketNumber}</span> {t.subject}
                  </span>
                  <Badge tone={['resolved', 'closed'].includes(t.status) ? 'green' : 'amber'}>{labelize(t.status)}</Badge>
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>
    </div>
  )
}

function SearchBox({ initial }) {
  const navigate = useNavigate()
  const [query, setQuery] = useState(initial)

  const search = (e) => {
    e.preventDefault()
    const s = query.trim().toUpperCase()
    if (s) navigate(`/operations/serials/${encodeURIComponent(s)}`)
  }

  return (
    <form onSubmit={search} className="flex max-w-xl gap-2">
      <input
        className={`${inputClass} font-mono`}
        placeholder="e.g. GRW3K-24-01001"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        autoFocus
      />
      <Button type="submit" disabled={!query.trim()}>
        Look up
      </Button>
    </form>
  )
}

function LookupResult({ serialNumber }) {
  const { data, loading, error } = useApiData(() => lookupSerial(serialNumber), serialNumber)
  if (loading) return <p className="text-sm text-slate-500">Looking up {serialNumber}...</p>
  if (error)
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        {error}. Check the number for typos, or stock it in from the Inventory page.
      </div>
    )
  return data ? <Trace item={data} /> : null
}

export default function SerialLookupPage() {
  // The URL is the source of truth, so a lookup can be shared or bookmarked.
  // Keying by serial resets the search box and result whenever the URL changes.
  const { serialNumber = '' } = useParams()
  const examples = useApiData(loadExamples)

  return (
    <OpsPageShell title="Serial Lookup" description="Type or paste a serial number to see its product, customer, order, installation, warranty and tickets.">
      <SearchBox key={`search-${serialNumber}`} initial={serialNumber} />

      {examples.data?.length > 0 && (
        <p className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
          Try:
          {examples.data.map((s) => (
            <Link
              key={s._id}
              to={`/operations/serials/${encodeURIComponent(s.serialNumber)}`}
              className="rounded bg-white px-2 py-0.5 font-mono text-amber-700 ring-1 ring-slate-200 hover:bg-amber-50"
            >
              {s.serialNumber}
            </Link>
          ))}
        </p>
      )}

      {serialNumber && <LookupResult key={`result-${serialNumber}`} serialNumber={serialNumber} />}
    </OpsPageShell>
  )
}
