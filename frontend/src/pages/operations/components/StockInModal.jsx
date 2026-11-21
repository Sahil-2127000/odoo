import { useMemo, useState } from 'react'
import { stockIn } from '../../../api/operations'
import { Badge, Button, Field, inputClass, Modal } from './ui'

const DEFAULT_WAREHOUSE = 'Main Warehouse - Ludhiana'

// Splits pasted text on new lines, commas, semicolons, tabs or spaces.
const parseSerials = (text) =>
  text
    .split(/[\s,;]+/)
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean)

// rows = stock summary rows ({ product, ... }); productId = product preselected from the table.
export default function StockInModal({ open, rows, productId, onClose, onDone }) {
  const [selectedId, setSelectedId] = useState(productId ?? rows[0]?.product._id ?? '')
  const [serialText, setSerialText] = useState('')
  const [quantity, setQuantity] = useState('')
  const [warehouse, setWarehouse] = useState(DEFAULT_WAREHOUSE)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)

  const row = rows.find((r) => r.product._id === selectedId)
  const tracked = row?.product.trackSerial

  const parsed = useMemo(() => {
    const all = parseSerials(serialText)
    const unique = [...new Set(all)]
    return { all, unique, repeated: all.length - unique.length }
  }, [serialText])

  const canSubmit = tracked ? parsed.unique.length > 0 : Number(quantity) > 0

  const submit = async () => {
    setSaving(true)
    setError('')
    try {
      const res = tracked
        ? await stockIn({ product: selectedId, serialNumbers: parsed.unique, warehouse })
        : await stockIn({ product: selectedId, quantity: Number(quantity), warehouse })
      setResult(res)
      onDone()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const resetForAnother = () => {
    setResult(null)
    setSerialText('')
    setQuantity('')
  }

  if (result) {
    return (
      <Modal
        open={open}
        title="Stock-in complete"
        onClose={onClose}
        footer={
          <>
            <Button variant="secondary" onClick={resetForAnother}>
              Stock in more
            </Button>
            <Button onClick={onClose}>Done</Button>
          </>
        }
      >
        <div className="space-y-3 text-sm">
          <p className="text-slate-700">
            <span className="text-2xl font-semibold text-emerald-600">{result.added}</span>{' '}
            {tracked ? 'serial number(s)' : `${row.unit} `} added to <span className="font-medium">{row.product.name}</span>.
          </p>
          {result.duplicates?.length > 0 && (
            <div className="rounded-md border border-amber-200 bg-amber-50 p-3">
              <p className="font-medium text-amber-900">{result.duplicates.length} skipped: these serials already exist in the system</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {result.duplicates.map((s) => (
                  <span key={s} className="rounded bg-white px-2 py-0.5 font-mono text-xs text-amber-900 ring-1 ring-amber-200">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </Modal>
    )
  }

  return (
    <Modal
      open={open}
      title="Stock in"
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={!canSubmit || saving}>
            {saving ? 'Saving...' : tracked ? `Add ${parsed.unique.length} serial(s)` : 'Add stock'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

        <Field label="Product">
          <select className={inputClass} value={selectedId} onChange={(e) => setSelectedId(e.target.value)}>
            {rows.map((r) => (
              <option key={r.product._id} value={r.product._id}>
                {r.product.name} ({r.product.sku})
              </option>
            ))}
          </select>
        </Field>

        {row && (
          <p className="flex items-center gap-2 text-xs text-slate-500">
            {tracked ? <Badge tone="blue">Serial tracked</Badge> : <Badge>Quantity only</Badge>}
            Currently in stock: <span className="font-medium text-slate-700">{row.inStock}</span> {row.unit}
          </p>
        )}

        {tracked ? (
          <Field
            label="Serial numbers"
            hint="Paste from a spreadsheet or type them: one per line, or separated by commas or spaces."
          >
            <textarea
              className={`${inputClass} h-40 font-mono`}
              value={serialText}
              onChange={(e) => setSerialText(e.target.value)}
              placeholder={'WAA540-26-02001\nWAA540-26-02002\nWAA540-26-02003'}
              autoFocus
            />
          </Field>
        ) : (
          <Field label={`Quantity (${row?.unit ?? ''})`}>
            <input className={inputClass} type="number" min="1" value={quantity} onChange={(e) => setQuantity(e.target.value)} autoFocus />
          </Field>
        )}

        {tracked && parsed.all.length > 0 && (
          <p className="text-sm text-slate-600">
            <span className="font-medium text-slate-900">{parsed.unique.length}</span> serial(s) ready
            {parsed.repeated > 0 && <span className="text-amber-700"> · {parsed.repeated} repeated in your list (counted once)</span>}
          </p>
        )}

        <Field label="Warehouse">
          <input className={inputClass} value={warehouse} onChange={(e) => setWarehouse(e.target.value)} />
        </Field>
      </div>
    </Modal>
  )
}
