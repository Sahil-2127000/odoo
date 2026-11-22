// /tech/surveys - site surveys sales assigned to me. On the roof I note the direction,
// tilt and cable length, then approve or reject the site. The cable length goes into the quote.
import { useEffect, useState } from 'react'
import { CheckCircle2, Phone, XCircle } from 'lucide-react'
import { Button, Card, EmptyState, Input, Loader, PageHeader, Select, Textarea, useToast } from '@/components/ui'
import { getMySurveys, recordSurvey } from '@/api/tech/surveys'
import { formatDate } from '@/utils/format'
import TechTabs from './TechTabs'

const DIRECTIONS = ['North', 'North-East', 'East', 'South-East', 'South', 'South-West', 'West', 'North-West']

const systemText = (e) =>
  e.systemType ? `${e.capacityKw ?? '?'} kW ${e.systemType === 'off_grid' ? 'Off-Grid' : 'On-Grid'}` : 'Not given'

export default function MySurveys() {
  const toast = useToast()
  const [surveys, setSurveys] = useState(null)

  function load() {
    getMySurveys()
      .then(setSurveys)
      .catch((err) => toast.error(err.message))
  }

  useEffect(load, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      <PageHeader title="My surveys" />
      <TechTabs />

      {surveys === null ? (
        <Loader />
      ) : surveys.length === 0 ? (
        <EmptyState title="No surveys assigned" description="Site surveys sales gives you will show up here" />
      ) : (
        <div className="space-y-3">
          {surveys.map((s) => (
            <SurveyCard key={s._id} survey={s} onDone={load} />
          ))}
        </div>
      )}
    </>
  )
}

function SurveyCard({ survey, onDone }) {
  const toast = useToast()
  const [direction, setDirection] = useState('South')
  const [tilt, setTilt] = useState('')
  const [cable, setCable] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(null) // 'approved' | 'rejected' while sending

  async function submit(result) {
    if (result === 'approved' && !(Number(cable) > 0)) {
      return toast.error('Enter the cable length in metres to approve the site')
    }
    setSaving(result)
    try {
      await recordSurvey(survey._id, {
        surveyStatus: result,
        surveyDirection: direction,
        surveyTilt: tilt === '' ? undefined : Number(tilt),
        surveyCableMeters: cable === '' ? undefined : Number(cable),
        surveyNotes: notes,
      })
      toast.success(result === 'approved' ? 'Site approved, sales can now make the quote' : 'Site rejected')
      onDone()
    } catch (err) {
      toast.error(err.message)
      setSaving(null)
    }
  }

  return (
    <Card padding={false}>
      <div className="space-y-3 p-4">
        <div className="flex items-center justify-between">
          <p className="font-mono text-sm font-semibold text-slate-900">{survey.code}</p>
          <span className="text-xs text-slate-500">Visit {formatDate(survey.surveyDate)}</span>
        </div>
        <div>
          <p className="text-sm font-medium text-slate-800">{survey.name}</p>
          <p className="text-xs text-slate-500">{survey.city}</p>
          <a href={`tel:${survey.phone}`} className="mt-1 inline-flex items-center gap-1 text-xs text-primary-600">
            <Phone className="h-3.5 w-3.5" /> {survey.phone}
          </a>
          <p className="mt-1 text-xs text-slate-600">Needs: {systemText(survey)}</p>
          {survey.note && <p className="mt-1 text-xs text-slate-500">Sales note: {survey.note}</p>}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Select label="Roof faces" value={direction} onChange={(e) => setDirection(e.target.value)} options={DIRECTIONS} />
          <Input label="Tilt (degrees)" type="number" inputMode="numeric" value={tilt} onChange={(e) => setTilt(e.target.value)} />
        </div>
        <Input
          label="Cable needed (metres)"
          type="number"
          inputMode="numeric"
          value={cable}
          onChange={(e) => setCable(e.target.value)}
          hint="From the roof to the inverter. The quote uses this length."
        />
        <Textarea label="Notes" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Shade, roof condition..." />

        <div className="grid grid-cols-2 gap-3">
          <Button variant="secondary" icon={XCircle} loading={saving === 'rejected'} disabled={Boolean(saving)} onClick={() => submit('rejected')}>
            Reject site
          </Button>
          <Button icon={CheckCircle2} loading={saving === 'approved'} disabled={Boolean(saving)} onClick={() => submit('approved')}>
            Approve site
          </Button>
        </div>
      </div>
    </Card>
  )
}
