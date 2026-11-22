// /sales/enquiries - incoming leads, the site-survey approval step, and converting to a customer.
import { useEffect, useState } from 'react'
import { ArrowRight } from 'lucide-react'
import { Badge, Button, DataTable, Input, Modal, PageHeader, Select, Tabs, Textarea, useToast } from '@/components/ui'
import { getEnquiries, updateEnquiry, updateSurvey, convertEnquiry } from '@/api/sales/enquiries'
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
    { key: 'surveyStatus', header: 'Survey', render: (r) => <Badge status={r.surveyStatus} /> },
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

  const [surveyStatus, setSurveyStatus] = useState(enquiry.surveyStatus)
  const [surveyNotes, setSurveyNotes] = useState(enquiry.surveyNotes || '')
  const [savingSurvey, setSavingSurvey] = useState(false)

  const [converting, setConverting] = useState(false)

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

  async function saveSurvey(e) {
    e.preventDefault()
    setSavingSurvey(true)
    try {
      const updated = await updateSurvey(enquiry._id, { surveyStatus, surveyNotes })
      toast.success('Survey updated')
      onUpdated(updated)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSavingSurvey(false)
    }
  }

  async function convert() {
    setConverting(true)
    try {
      await convertEnquiry(enquiry._id, {})
      toast.success(`${enquiry.name} is now a customer`)
      onUpdated({ ...enquiry, status: 'converted' })
    } catch (err) {
      toast.error(err.message)
    } finally {
      setConverting(false)
    }
  }

  const canConvert = surveyStatus === 'approved' && enquiry.status !== 'converted'

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

        <form onSubmit={saveSurvey} className="space-y-4 border-t border-slate-100 pt-5">
          <h3 className="text-xs font-semibold tracking-wide text-slate-500 uppercase">Site survey</h3>
          <Select
            label="Survey result"
            value={surveyStatus}
            onChange={(e) => setSurveyStatus(e.target.value)}
            options={[
              { value: 'pending', label: 'Pending' },
              { value: 'approved', label: 'Approved' },
              { value: 'rejected', label: 'Rejected' },
            ]}
          />
          <Textarea
            label="Survey notes"
            placeholder="Roof direction, tilt, cable length..."
            value={surveyNotes}
            onChange={(e) => setSurveyNotes(e.target.value)}
            rows={2}
          />
          <Button type="submit" variant="secondary" size="sm" loading={savingSurvey}>
            Save survey
          </Button>
        </form>

        <div className="border-t border-slate-100 pt-5">
          <Button icon={ArrowRight} onClick={convert} loading={converting} disabled={!canConvert} fullWidth>
            {enquiry.status === 'converted' ? 'Already converted' : 'Convert to customer'}
          </Button>
          {!canConvert && enquiry.status !== 'converted' && (
            <p className="mt-2 text-center text-xs text-slate-500">Approve the site survey first.</p>
          )}
        </div>
      </div>
    </Modal>
  )
}
