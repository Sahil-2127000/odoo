// Quotation builder: pick customer + survey, start from a kit, edit the bill of materials, live totals.
// Routes: /sales/quotations/new (?customerId=&surveyId=&recommendedKw=) and /sales/quotations/:id/edit
import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useToast } from '@/components/ui'
import PageShell from './PageShell'
import { Button, Card, Input, Select, Badge } from './ui'
import { customersApi, surveysApi, quotationsApi, productsApi } from '@/api/sales'
import { mockKitTemplates } from '@/mocks/sales/kitTemplates'
import { DEFAULT_GST_RATE, SYSTEM_TYPES, computeTotals, formatCurrency, formatDate, listFrom } from './salesHelpers'

const emptyLine = () => ({ key: crypto.randomUUID(), productId: '', productName: '', qty: 1, unitPrice: 0 })

export default function QuotationBuilderPage() {
  const { id: editId } = useParams()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const toast = useToast()

  const [customers, setCustomers] = useState([])
  const [products, setProducts] = useState([])
  const [surveys, setSurveys] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState({})
  const [existing, setExisting] = useState(null)

  const [form, setForm] = useState({
    customerId: params.get('customerId') || '',
    surveyId: params.get('surveyId') || '',
    systemCapacityKw: Number(params.get('recommendedKw')) || 3,
    systemType: 'on_grid',
    gstRate: DEFAULT_GST_RATE,
    discount: 0,
    notes: '25-year panel performance warranty, 5-year inverter warranty. Quote valid for 15 days.',
  })
  const [lines, setLines] = useState([emptyLine()])

  // Initial data: customers, product catalogue, and the quote being edited (if any).
  useEffect(() => {
    const loadAll = async () => {
      const [custRes, prodRes] = await Promise.all([customersApi.getCustomers(), productsApi.getProducts()])
      setCustomers(listFrom(custRes))
      setProducts(listFrom(prodRes))
      if (editId) {
        const qRes = await quotationsApi.getQuotationById(editId)
        const q = qRes?.data
        if (q) {
          setExisting(q)
          setForm({
            customerId: q.customerId,
            surveyId: q.surveyId || '',
            systemCapacityKw: q.systemCapacityKw,
            systemType: q.systemType,
            gstRate: q.gstRate,
            discount: q.discount,
            notes: q.notes || '',
          })
          setLines((q.lines || []).map((l) => ({ ...l, key: crypto.randomUUID() })))
        }
      }
      setLoading(false)
    }
    loadAll()
  }, [editId])

  // Completed surveys for the chosen customer.
  useEffect(() => {
    if (!form.customerId) {
      setSurveys([])
      return
    }
    surveysApi.getSurveys({ customerId: form.customerId, status: 'completed' }).then((res) => setSurveys(listFrom(res)))
  }, [form.customerId])

  const customer = customers.find((c) => c.id === form.customerId)
  const survey = surveys.find((s) => s.id === form.surveyId)
  const totals = useMemo(() => computeTotals(lines, form.gstRate, form.discount), [lines, form.gstRate, form.discount])
  const panelWatts = lines
    .filter((l) => l.productId === 'prod_panel_540')
    .reduce((sum, l) => sum + (Number(l.qty) || 0) * 540, 0)

  const setField = (name, value) => {
    setForm((f) => ({ ...f, [name]: value }))
    setErrors((e) => ({ ...e, [name]: undefined }))
  }

  const onSurveyChange = (surveyId) => {
    const s = surveys.find((x) => x.id === surveyId)
    setForm((f) => ({ ...f, surveyId, systemCapacityKw: s?.recommendedKw || f.systemCapacityKw }))
  }

  const applyKit = (kit) => {
    setLines(kit.items.map((item) => ({ ...item, key: crypto.randomUUID() })))
    setForm((f) => ({ ...f, systemCapacityKw: kit.capacityKw, systemType: kit.systemType }))
    setErrors((e) => ({ ...e, lines: undefined }))
    toast.success(`Loaded "${kit.name}"`)
  }

  const updateLine = (key, patch) => setLines((ls) => ls.map((l) => (l.key === key ? { ...l, ...patch } : l)))

  const onProductChange = (key, productId) => {
    const p = products.find((x) => x.id === productId)
    updateLine(key, { productId, productName: p?.name || '', unitPrice: p?.unitPrice || 0 })
    setErrors((e) => ({ ...e, lines: undefined }))
  }

  const validate = () => {
    const e = {}
    if (!form.customerId) e.customerId = 'Choose a customer'
    if (!(Number(form.systemCapacityKw) > 0)) e.systemCapacityKw = 'Enter the system size'
    const valid = lines.filter((l) => l.productId && Number(l.qty) > 0)
    if (valid.length === 0) e.lines = 'Add at least one product line'
    if (Number(form.discount) < 0) e.discount = 'Discount cannot be negative'
    if (Number(form.discount) > totals.subtotal + totals.gstAmount) e.discount = 'Discount is larger than the total'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const save = async (status) => {
    if (!validate()) {
      toast.error('Please fix the highlighted fields')
      return
    }
    setSaving(true)
    const cleanLines = lines
      .filter((l) => l.productId && Number(l.qty) > 0)
      .map(({ productId, productName, qty, unitPrice }) => ({
        productId,
        productName,
        qty: Number(qty),
        unitPrice: Number(unitPrice),
        total: Number(qty) * Number(unitPrice),
      }))
    const payload = {
      customerId: form.customerId,
      customerName: customer?.name,
      surveyId: form.surveyId || null,
      systemCapacityKw: Number(form.systemCapacityKw),
      systemType: form.systemType,
      lines: cleanLines,
      gstRate: Number(form.gstRate),
      discount: Number(form.discount) || 0,
      notes: form.notes,
      status,
    }
    const res = editId
      ? await quotationsApi.updateQuotation(editId, { ...payload, ...computeTotals(cleanLines, payload.gstRate, payload.discount) })
      : await quotationsApi.createQuotation(payload)
    setSaving(false)
    if (res?.success === false) {
      toast.error(res.message || 'Could not save quotation')
      return
    }
    const saved = res?.data
    toast.success(`${saved?.quotationNumber || 'Quotation'} saved as ${status}`)
    navigate(status === 'sent' ? `/sales/quotations/${saved.id}/print` : '/sales/quotations')
  }

  if (editId && !loading && existing && !['draft', 'sent'].includes(existing.status)) {
    return (
      <PageShell title="Edit quotation" breadcrumbs={[{ label: 'Quotations', path: '/sales/quotations' }, { label: existing.quotationNumber }]}>
        <Card>
          <p className="text-sm text-slate-600">
            {existing.quotationNumber} is <Badge statusKey={existing.status} size="sm">{existing.status}</Badge> and can no longer be edited.
          </p>
        </Card>
      </PageShell>
    )
  }

  const productOptions = products.map((p) => ({ value: p.id, label: `${p.name} — ${formatCurrency(p.unitPrice)}/${p.unit}` }))

  return (
    <PageShell
      title={editId ? `Edit ${existing?.quotationNumber || 'quotation'}` : 'New quotation'}
      subtitle="Assemble the bill of materials. Totals update as you type."
      breadcrumbs={[{ label: 'Quotations', path: '/sales/quotations' }, { label: editId ? 'Edit' : 'New' }]}
    >
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <Card title="Customer & site">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Select
                label="Customer"
                name="customerId"
                required
                value={form.customerId}
                onChange={(e) => {
                  setField('customerId', e.target.value)
                  setField('surveyId', '')
                }}
                placeholder={loading ? 'Loading…' : 'Select customer'}
                options={customers.map((c) => ({ value: c.id, label: `${c.name} · ${c.city}` }))}
                error={errors.customerId}
                disabled={!!editId}
              />
              <Select
                label="Completed site survey"
                name="surveyId"
                value={form.surveyId}
                onChange={(e) => onSurveyChange(e.target.value)}
                options={[
                  { value: '', label: surveys.length ? 'No survey linked' : 'No completed surveys' },
                  ...surveys.map((s) => ({ value: s.id, label: `${formatDate(s.completedAt || s.scheduledDate)} · ${s.recommendedKw} kW recommended` })),
                ]}
                disabled={!form.customerId}
              />
            </div>
            {customer && (
              <div className="mt-4 grid grid-cols-2 gap-3 rounded-lg bg-slate-50 p-3 text-xs sm:grid-cols-4">
                <div><div className="text-slate-400">Phone</div><div className="font-medium text-slate-700">{customer.phone}</div></div>
                <div><div className="text-slate-400">City</div><div className="font-medium text-slate-700">{customer.city}</div></div>
                <div><div className="text-slate-400">Monthly bill</div><div className="font-medium text-slate-700">{formatCurrency(customer.monthlyBill)}</div></div>
                <div>
                  <div className="text-slate-400">Survey</div>
                  <div className="font-medium text-slate-700">
                    {survey ? `${survey.roofType?.replace(/_/g, ' ')} · ${survey.roofArea} sq ft · ${survey.shading} shade` : '—'}
                  </div>
                </div>
              </div>
            )}
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label="System capacity (kW)"
                name="systemCapacityKw"
                type="number"
                min="0.5"
                step="0.5"
                required
                value={form.systemCapacityKw}
                onChange={(e) => setField('systemCapacityKw', e.target.value)}
                error={errors.systemCapacityKw}
                helperText={panelWatts ? `Panels in BOM: ${(panelWatts / 1000).toFixed(2)} kWp` : undefined}
              />
              <Select label="System type" name="systemType" value={form.systemType} onChange={(e) => setField('systemType', e.target.value)} options={SYSTEM_TYPES} />
            </div>
          </Card>

          <Card title="Start from a package" subtitle="Replaces the current lines with a pre-configured kit.">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              {mockKitTemplates.map((kit) => {
                const kitTotal = kit.items.reduce((s, i) => s + i.qty * i.unitPrice, 0)
                return (
                  <button
                    key={kit.id}
                    type="button"
                    onClick={() => applyKit(kit)}
                    className="rounded-lg border border-slate-200 p-3 text-left transition-colors hover:border-amber-300 hover:bg-amber-50/40"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-bold text-slate-900">{kit.capacityKw} kW</span>
                      <Badge statusKey={kit.systemType} size="sm">{kit.systemType}</Badge>
                    </div>
                    <div className="mt-1 text-xs font-medium text-slate-700">{kit.name}</div>
                    <div className="mt-2 text-xs text-slate-400">{formatCurrency(kitTotal)} before GST</div>
                  </button>
                )
              })}
            </div>
          </Card>

          <Card
            title="Bill of materials"
            actions={<Button size="sm" variant="outline" onClick={() => setLines((ls) => [...ls, emptyLine()])}>+ Add line</Button>}
          >
            {errors.lines && <p className="mb-3 text-xs text-rose-600">{errors.lines}</p>}
            <div className="space-y-3">
              {lines.map((line, idx) => (
                <div key={line.key} className="grid grid-cols-12 items-end gap-2 rounded-lg border border-slate-100 p-3">
                  <Select
                    className="col-span-12 md:col-span-5"
                    label={idx === 0 ? 'Product' : undefined}
                    name={`product-${line.key}`}
                    value={line.productId}
                    onChange={(e) => onProductChange(line.key, e.target.value)}
                    placeholder="Select product"
                    options={productOptions}
                  />
                  <Input
                    className="col-span-4 md:col-span-2"
                    label={idx === 0 ? 'Qty' : undefined}
                    name={`qty-${line.key}`}
                    type="number"
                    min="1"
                    value={line.qty}
                    onChange={(e) => updateLine(line.key, { qty: e.target.value })}
                  />
                  <Input
                    className="col-span-5 md:col-span-3"
                    label={idx === 0 ? 'Unit price' : undefined}
                    name={`price-${line.key}`}
                    type="number"
                    min="0"
                    prefix="₹"
                    value={line.unitPrice}
                    onChange={(e) => updateLine(line.key, { unitPrice: e.target.value })}
                  />
                  <div className="col-span-2 py-2 text-right text-sm font-semibold text-slate-900 md:col-span-1">
                    {formatCurrency((Number(line.qty) || 0) * (Number(line.unitPrice) || 0), { compact: true })}
                  </div>
                  <button
                    type="button"
                    title="Remove line"
                    onClick={() => setLines((ls) => (ls.length > 1 ? ls.filter((l) => l.key !== line.key) : [emptyLine()]))}
                    className="col-span-1 rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Summary" className="xl:sticky xl:top-20">
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-slate-500">Subtotal</dt><dd className="font-medium">{formatCurrency(totals.subtotal)}</dd></div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-slate-500">GST rate (%)</dt>
                <dd className="w-24">
                  <Input name="gstRate" type="number" step="0.1" min="0" value={form.gstRate} onChange={(e) => setField('gstRate', e.target.value)} />
                </dd>
              </div>
              <div className="flex justify-between"><dt className="text-slate-500">GST amount</dt><dd className="font-medium">{formatCurrency(totals.gstAmount)}</dd></div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-slate-500">Discount</dt>
                <dd className="w-32">
                  <Input name="discount" type="number" min="0" prefix="₹" value={form.discount} onChange={(e) => setField('discount', e.target.value)} error={errors.discount} />
                </dd>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-3 text-base">
                <dt className="font-bold text-slate-900">Grand total</dt>
                <dd className="font-bold text-amber-700">{formatCurrency(totals.grandTotal)}</dd>
              </div>
              {Number(form.systemCapacityKw) > 0 && totals.grandTotal > 0 && (
                <div className="text-right text-xs text-slate-400">
                  {formatCurrency(totals.grandTotal / Number(form.systemCapacityKw))} per kW
                </div>
              )}
            </dl>

            <label className="mt-5 block text-xs font-semibold text-slate-700" htmlFor="notes">Terms &amp; notes</label>
            <textarea
              id="notes"
              rows={4}
              value={form.notes}
              onChange={(e) => setField('notes', e.target.value)}
              className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />

            <div className="mt-5 flex flex-col gap-2">
              <Button onClick={() => save('sent')} loading={saving} disabled={loading}>Save &amp; mark as sent</Button>
              <Button variant="outline" onClick={() => save('draft')} disabled={saving || loading}>Save as draft</Button>
              <Button variant="ghost" onClick={() => navigate(-1)} disabled={saving}>Cancel</Button>
            </div>
          </Card>
        </div>
      </div>
    </PageShell>
  )
}
