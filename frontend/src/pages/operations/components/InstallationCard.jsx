import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle2, ChevronDown, ChevronUp, MapPin, Play, Users } from 'lucide-react'
import { getInstallation } from '@/api/operations'
import { Badge, Button } from '@/components/ui'
import { useApiData } from '../useApiData'
import { formatDate, labelize, SERIAL_STATUS_TONE } from '../utils'

// Lazily loads and lists the serial numbers on this job.
function SerialList({ installationId, status }) {
  // `status` in the key refetches after Start / Complete, so serial badges stay current.
  const { data, loading, error } = useApiData(() => getInstallation(installationId), `${installationId}-${status}`)

  if (loading) return <p className="text-xs text-slate-500">Loading serials...</p>
  if (error) return <p className="text-xs text-red-600">{error}</p>
  return (
    <ul className="max-h-40 space-y-1 overflow-y-auto">
      {data.serialItems.map((s) => (
        <li key={s._id} className="flex items-center justify-between gap-2 text-xs">
          <Link to={`/operations/serials/${encodeURIComponent(s.serialNumber)}`} className="font-mono text-amber-700 hover:underline">
            {s.serialNumber}
          </Link>
          <span className="truncate text-slate-500">{s.product.name}</span>
          <Badge tone={SERIAL_STATUS_TONE[s.status]} dot={false}>
            {labelize(s.status)}
          </Badge>
        </li>
      ))}
    </ul>
  )
}

export default function InstallationCard({ inst, busy, onStart, onComplete }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-slate-900">{inst.customer?.name}</p>
          <p className="text-xs text-slate-500">
            {inst.installationNumber} · {inst.order?.orderNumber} · {inst.systemSizeKw} kW
          </p>
        </div>
        {inst.status === 'completed' && <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />}
      </div>

      <p className="mt-2 flex items-start gap-1.5 text-xs text-slate-600">
        <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {inst.siteAddress}
      </p>
      <p className="mt-1 flex items-start gap-1.5 text-xs text-slate-600">
        <Users className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {inst.technicians.map((t) => t.name).join(', ')}
      </p>
      {inst.notes && <p className="mt-2 rounded bg-slate-50 px-2 py-1 text-xs text-slate-600">{inst.notes}</p>}
      {inst.completedAt && <p className="mt-2 text-xs text-emerald-700">Completed {formatDate(inst.completedAt)} · warranties active</p>}

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-2">
        <button type="button" onClick={() => setOpen((v) => !v)} className="flex cursor-pointer items-center gap-1 text-xs text-slate-500 hover:text-slate-800">
          {open ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />} Serials
        </button>
        {inst.status === 'scheduled' && (
          <Button size="sm" variant="secondary" icon={Play} loading={busy} onClick={() => onStart(inst)}>
            Start job
          </Button>
        )}
        {inst.status === 'in_progress' && (
          <Button size="sm" icon={CheckCircle2} loading={busy} onClick={() => onComplete(inst)}>
            Mark complete
          </Button>
        )}
      </div>
      {open && (
        <div className="mt-2">
          <SerialList installationId={inst._id} status={inst.status} />
        </div>
      )}
    </div>
  )
}
