import { useMemo, useState } from 'react'
import { getTechnicians, setTechnicianStatus, TECHNICIAN_STATUSES } from '../../api/operations'
import OpsPageShell, { ShellStatus, StatCard } from './components/OpsPageShell'
import TechnicianFormModal from './components/TechnicianFormModal'
import { Badge, Button, inputClass } from './components/ui'
import { useApiData } from './useApiData'
import { labelize, TECH_STATUS_TONE } from './utils'

const STATUS_PHRASE = { available: 'available', on_job: 'on a job', leave: 'on leave' }

export default function TechniciansPage() {
  const { data: techs, loading, error, reload } = useApiData(() => getTechnicians())
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('')
  const [modal, setModal] = useState({ open: false, technician: null })
  const [toast, setToast] = useState({ text: '', tone: 'ok' })
  const [busyId, setBusyId] = useState(null)

  const flash = (text, tone = 'ok') => {
    setToast({ text, tone })
    setTimeout(() => setToast({ text: '', tone: 'ok' }), 3000)
  }

  const count = (s) => techs?.filter((t) => t.status === s).length ?? 0

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase()
    return (techs ?? []).filter(
      (t) => (!status || t.status === status) && (!term || [t.name, t.phone, ...t.skills].some((v) => v.toLowerCase().includes(term))),
    )
  }, [techs, q, status])

  const changeStatus = async (tech, next) => {
    setBusyId(tech._id)
    try {
      await setTechnicianStatus(tech._id, next)
      flash(`${tech.name} is now ${STATUS_PHRASE[next]}`)
      reload()
    } catch (err) {
      flash(err.message, 'error')
    } finally {
      setBusyId(null)
    }
  }

  const onSaved = (saved, isEdit) => {
    setModal({ open: false, technician: null })
    flash(isEdit ? `Updated ${saved.name}` : `Added ${saved.name}`)
    reload()
  }

  const tabs = [{ key: '', label: 'All', n: techs?.length ?? 0 }, ...TECHNICIAN_STATUSES.map((s) => ({ key: s, label: labelize(s), n: count(s) }))]

  return (
    <OpsPageShell title="Technicians" description="Installation and service crew. Technicians don't log in; operations updates their availability here.">
      <ShellStatus loading={loading && !techs} error={error}>
        {techs && (
          <>
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <StatCard label="Total crew" value={techs.length} />
              <StatCard label="Available" value={count('available')} tone="green" />
              <StatCard label="On job" value={count('on_job')} tone="blue" />
              <StatCard label="On leave" value={count('leave')} tone="amber" />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex flex-wrap gap-2">
                {tabs.map((t) => (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => setStatus(t.key)}
                    className={`rounded-full px-3 py-1 text-xs font-medium ${status === t.key ? 'bg-slate-800 text-white' : 'bg-white text-slate-700 ring-1 ring-slate-200'}`}
                  >
                    {t.label} {t.n}
                  </button>
                ))}
              </div>
              <input className={`${inputClass} max-w-xs`} placeholder="Search name, phone or skill" value={q} onChange={(e) => setQ(e.target.value)} />
              <div className="ml-auto flex items-center gap-3">
                {toast.text && <span className={`text-sm ${toast.tone === 'error' ? 'text-red-600' : 'text-emerald-700'}`}>{toast.text}</span>}
                <Button onClick={() => setModal({ open: true, technician: null })}>+ Add technician</Button>
              </div>
            </div>

            <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Technician</th>
                    <th className="px-4 py-3">Contact</th>
                    <th className="px-4 py-3">Skills</th>
                    <th className="px-4 py-3">Availability</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((t) => (
                    <tr key={t._id}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-100 text-xs font-semibold text-amber-800">
                            {t.name
                              .split(' ')
                              .map((w) => w[0])
                              .join('')
                              .slice(0, 2)
                              .toUpperCase()}
                          </span>
                          <div>
                            <p className="font-medium text-slate-900">{t.name}</p>
                            <Badge tone={TECH_STATUS_TONE[t.status]}>{labelize(t.status)}</Badge>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        <p>{t.phone}</p>
                        <p className="text-xs text-slate-500">{t.email || '-'}</p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {t.skills.map((s) => (
                            <Badge key={s}>{labelize(s)}</Badge>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <select
                          aria-label={`Availability of ${t.name}`}
                          className={`${inputClass} min-w-[8.5rem] py-1.5`}
                          value={t.status}
                          disabled={busyId === t._id}
                          onChange={(e) => changeStatus(t, e.target.value)}
                        >
                          {TECHNICIAN_STATUSES.map((s) => (
                            <option key={s} value={s}>
                              {labelize(s)}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button variant="ghost" onClick={() => setModal({ open: true, technician: t })}>
                          Edit
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-10 text-center text-sm text-slate-500">
                        No technicians match.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </ShellStatus>

      {modal.open && (
        <TechnicianFormModal
          key={modal.technician?._id ?? 'new'}
          open
          technician={modal.technician}
          onClose={() => setModal({ open: false, technician: null })}
          onSaved={onSaved}
        />
      )}
    </OpsPageShell>
  )
}
