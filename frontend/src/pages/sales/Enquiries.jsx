// /sales/enquiries - incoming leads, assigning the site survey to a technician,
// and converting to a customer (which also creates the quote from the matching kit).
import { useEffect, useState } from 'react'
import { ArrowRight } from 'lucide-react'
import { Badge, Button, DataTable, Input, Modal, PageHeader, Select, Tabs, Textarea, useToast } from '@/components/ui'
import { assignSurvey, convertEnquiry, getEnquiries, updateEnquiry } from '@/api/sales/enquiries'
import { getTechnicians } from '@/api/sales/tickets'
import { getOrders } from '@/api/sales/orders'
import { ENQUIRY_STATUSES, statusLabel } from '@/constants/status'
import { formatDate } from '@/utils/format'

const TABS = ENQUIRY_STATUSES.map((value) => ({ value, label: statusLabel(value) }))

// { capacityKw: 3, systemType: 'off_grid' } -> "3 kW Off-Grid"
const systemText = (r) =>
  r.systemType ? `${r.capacityKw ?? '?'} kW ${r.systemType === 'off_grid' ? 'Off-Grid' : 'On-Grid'}` : '—'

export default function Enquiries() {
  const toast = useToast()
  const [tab, setTab] = useState('new')
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(null) // the enquiry being viewed/edited

  function load() {
    setLoading(true)
    getEnquiries(tab)
      .then(setRows)
      .catch((err) => toast.error(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(load, [tab]) // eslint-disable-line react-hooks/exhaustive-deps

  function handleUpdated(updated) {
    setOpen(updated)
    load()
  }

  const columns = [
    { key: 'code', header: 'Code', className: 'font-mono text-xs' },
    { key: 'name', header: 'Name', sortable: true },
    { key: 'phone', header: 'Phone' },
    { key: 'city', header: 'City' },
    { key: 'systemType', header: 'Needs', render: systemText },
    {
      key: 'surveyStatus',
      header: 'Survey',
      render: (r) => (
        <span className="inline-flex items-center gap-2">
          <Badge status={r.surveyStatus} />
          {r.surveyTechnician && <span className="text-xs text-slate-500">{r.surveyTechnician.name}</span>}
        </span>
      ),
    },
    { key: 'nextFollowUp', header: 'Next follow-up', render: (r) => formatDate(r.nextFollowUp) },
    { key: 'status', header: 'Status', render: (r) => <Badge status={r.status} /> },
  ]

  return (
    <>
      <PageHeader title="Enquiries" subtitle="Leads from the landing page, call or WhatsApp" />

      <Tabs value={tab} onChange={setTab} tabs={TABS} className="mb-4" />

      <DataTable
        columns={columns}
        data={rows}
        loading={loading}
        onRowClick={setOpen}
        searchable
        searchKeys={['code', 'name', 'phone', 'city']}
        emptyTitle="No enquiries here"
      />

      {open && <EnquiryModal enquiry={open} onClose={() => setOpen(null)} onUpdated={handleUpdated} />}
    </>
  )
}

function EnquiryModal({ enquiry, onClose, onUpdated }) {
  const toast = useToast()

  const [note, setNote] = useState(enquiry.note || '')
  const [status, setStatus] = useState(enquiry.status)
  const [nextFollowUp, setNextFollowUp] = useState(enquiry.nextFollowUp ? enquiry.nextFollowUp.slice(0, 10) : '')
  const [savingDetails, setSavingDetails] = useState(false)

  // survey assignment
  const [technicians, setTechnicians] = useState([]) // [{ _id, name, surveys, installs }]
  const [technician, setTechnician] = useState(enquiry.surveyTechnician?._id || '')
  const [surveyDate, setSurveyDate] = useState(enquiry.surveyDate ? enquiry.surveyDate.slice(0, 10) : '')
  const [assigning, setAssigning] = useState(false)

  const [converting, setConverting] = useState(false)

  // Count each technician's pending work so sales can pick whoever is free
  useEffect(() => {
    if (enquiry.surveyStatus !== 'pending') return
    Promise.all([getTechnicians(), getEnquiries(), getOrders('delivered')])
      .then(([techs, enquiries, orders]) => {
        setTechnicians(
          techs
            .filter((t) => t.isActive)
            .map((t) => ({
              ...t,
              surveys: enquiries.filter((e) => e.surveyStatus === 'pending' && e.surveyTechnician?._id === t._id).length,
              installs: orders.filter((o) => o.assignedTechnician?._id === t._id).length,
            })),
        )
      })
      .catch((err) => toast.error(err.message))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function saveDetails(e) {
    e.preventDefault()
    setSavingDetails(true)
    try {
      const updated = await updateEnquiry(enquiry._id, { status, note, nextFollowUp: nextFollowUp || null })
      toast.success('Enquiry updated')
      onUpdated(updated)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSavingDetails(false)
    }
  }

  async function assign(e) {
    e.preventDefault()
    if (!technician || !surveyDate) return
    setAssigning(true)
    try {
      const updated = await assignSurvey(enquiry._id, { surveyTechnician: technician, surveyDate })
      toast.success(`Survey assigned to ${updated.surveyTechnician.name}`)
      onUpdated(updated)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setAssigning(false)
    }
  }

  async function convert() {
    setConverting(true)
    try {
      const { quote } = await convertEnquiry(enquiry._id, {})
      toast.success(
        quote
          ? `${enquiry.name} is now a customer. Quote ${quote.code} is ready in Orders`
          : `${enquiry.name} is now a customer. No matching kit, create the quote in Orders`,
      )
      onUpdated({ ...enquiry, status: 'converted' })
    } catch (err) {
      toast.error(err.message)
    } finally {
      setConverting(false)
    }
  }

  const canConvert = enquiry.surveyStatus === 'approved' && enquiry.status !== 'converted'
  const waitingFor = !enquiry.surveyTechnician
    ? 'Assign a technician for the site survey first.'
    : "Waiting for the technician's survey result."

  return (
    <Modal
      open
      onClose={onClose}
      title={enquiry.name}
      description={`${enquiry.code} · ${enquiry.phone} · Needs ${systemText(enquiry)}`}
      size="lg"
    >
      <div className="space-y-6">
        <form onSubmit={saveDetails} className="space-y-4">
          <h3 className="text-xs font-semibold tracking-wide text-slate-500 uppercase">Call notes</h3>
          <Select
            label="Status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            options={ENQUIRY_STATUSES.map((v) => ({ value: v, label: statusLabel(v) }))}
          />
          <Textarea label="Note" value={note} onChange={(e) => setNote(e.target.value)} rows={2} />
          {status === 'follow_up' && (
            <Input
              label="Next follow-up date"
              type="date"
              value={nextFollowUp}
              onChange={(e) => setNextFollowUp(e.target.value)}
            />
          )}
          <Button type="submit" variant="secondary" size="sm" loading={savingDetails}>
            Save notes
          </Button>
        </form>

        <div className="space-y-4 border-t border-slate-100 pt-5">
          <h3 className="text-xs font-semibold tracking-wide text-slate-500 uppercase">Site survey</h3>

          {enquiry.surveyStatus === 'pending' ? (
            // Sales picks the technician + date; the technician records the result on their phone
            <form onSubmit={assign} className="space-y-4">
              {enquiry.surveyTechnician && (
                <p className="rounded-lg bg-info-50 px-3 py-2 text-sm text-info-700">
                  Assigned to {enquiry.surveyTechnician.name} for {formatDate(enquiry.surveyDate)}. Waiting for their result.
                </p>
              )}
              <div className="grid gap-4 sm:grid-cols-2">
                <Select
                  label="Technician"
                  value={technician}
                  onChange={(e) => setTechnician(e.target.value)}
                  placeholder="Pick whoever is free"
                  options={technicians.map((t) => ({
                    value: t._id,
                    label: `${t.name} (${t.surveys} survey${t.surveys === 1 ? '' : 's'}, ${t.installs} install${t.installs === 1 ? '' : 's'} pending)`,
                  }))}
                />
                <Input label="Visit date" type="date" value={surveyDate} onChange={(e) => setSurveyDate(e.target.value)} />
              </div>
              <Button type="submit" variant="secondary" size="sm" loading={assigning} disabled={!technician || !surveyDate}>
                {enquiry.surveyTechnician ? 'Re-assign survey' : 'Assign survey'}
              </Button>
            </form>
          ) : (
            <SurveyResult enquiry={enquiry} />
          )}
        </div>

        <div className="border-t border-slate-100 pt-5">
          <Button icon={ArrowRight} onClick={convert} loading={converting} disabled={!canConvert} fullWidth>
            {enquiry.status === 'converted' ? 'Already converted' : 'Convert to customer & make quote'}
          </Button>
          {!canConvert && enquiry.status !== 'converted' && (
            <p className="mt-2 text-center text-xs text-slate-500">
              {enquiry.surveyStatus === 'rejected' ? 'The site was rejected in the survey.' : waitingFor}
            </p>
          )}
        </div>
      </div>
    </Modal>
  )
}

// What the technician recorded on the roof (read-only for sales)
function SurveyResult({ enquiry }) {
  const rows = [
    ['Roof faces', enquiry.surveyDirection],
    ['Tilt', enquiry.surveyTilt != null ? `${enquiry.surveyTilt}°` : null],
    ['Cable needed', enquiry.surveyCableMeters != null ? `${enquiry.surveyCableMeters} m` : null],
    ['Notes', enquiry.surveyNotes],
  ]
  return (
    <div className="space-y-2 text-sm">
      <p className="flex flex-wrap items-center gap-2">
        <Badge status={enquiry.surveyStatus} />
        <span className="text-slate-600">
          by {enquiry.surveyTechnician?.name ?? 'technician'}
          {enquiry.surveyDate && ` on ${formatDate(enquiry.surveyDate)}`}
        </span>
      </p>
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
        {rows
          .filter(([, value]) => value)
          .map(([label, value]) => (
            <div key={label} className="contents">
              <dt className="text-slate-500">{label}</dt>
              <dd className="text-slate-900">{value}</dd>
            </div>
          ))}
      </dl>
    </div>
  )
}
