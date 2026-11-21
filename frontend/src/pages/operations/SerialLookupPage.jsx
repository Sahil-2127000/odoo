import { useParams } from 'react-router-dom'
import OpsPageShell from './components/OpsPageShell'

export default function SerialLookupPage() {
  const { serialNumber } = useParams()
  return (
    <OpsPageShell
      title="Serial Lookup"
      description="Trace any unit to its product, order, customer, installation and warranty."
      phase="Phase 1"
      todo={[
        'Search box (typed or pasted serial)',
        'Trace card: product, status, order, customer, installation, warranty',
        'Linked tickets and a Raise ticket action',
      ]}
    >
      {serialNumber && (
        <p className="text-sm text-slate-600">
          Requested serial: <span className="font-mono">{serialNumber}</span>
        </p>
      )}
    </OpsPageShell>
  )
}
