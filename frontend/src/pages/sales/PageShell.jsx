// Sales page wrapper. Renders inside DashboardLayout (shared sidebar + top bar),
// so it only adds breadcrumbs, the page header, and the Mock/Real API switch.
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { RotateCcw } from 'lucide-react'
import { PageHeader, useToast } from '@/components/ui'
import { isGlobalMockEnabled, setGlobalMockEnabled } from '@/api/sales/http'
import mockDb from '@/mocks/sales/mockDb'

export default function PageShell({ title, subtitle, actions, breadcrumbs = [], children }) {
  const [isMock, setIsMock] = useState(isGlobalMockEnabled())
  const toast = useToast()

  useEffect(() => {
    const onToggle = () => setIsMock(isGlobalMockEnabled())
    window.addEventListener('sales_mock_toggle', onToggle)
    return () => window.removeEventListener('sales_mock_toggle', onToggle)
  }, [])

  const toggleMock = () => {
    const next = !isMock
    setIsMock(next)
    setGlobalMockEnabled(next)
    toast.success(`API mode: ${next ? 'Mock data' : 'Real backend'}`)
  }

  const resetData = () => {
    if (window.confirm('Reset demo data to initial state?')) {
      mockDb.reset()
      window.location.reload()
    }
  }

  const apiControls = (
    <>
      <button
        type="button"
        onClick={toggleMock}
        title="Toggle between Mock and Real API"
        className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold transition-colors ${
          isMock
            ? 'border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100'
            : 'border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
        }`}
      >
        <span className={`h-2 w-2 rounded-full ${isMock ? 'animate-pulse bg-amber-500' : 'bg-emerald-500'}`} />
        API: {isMock ? 'Mock DB' : 'Real Server'}
      </button>
      {isMock && (
        <button
          type="button"
          onClick={resetData}
          title="Reset mock data"
          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
        >
          <RotateCcw className="h-4 w-4" />
        </button>
      )}
    </>
  )

  return (
    <>
      {breadcrumbs.length > 0 && (
        <nav className="mb-2 flex items-center gap-1.5 text-xs text-slate-400">
          <Link to="/sales" className="hover:text-slate-600">Sales</Link>
          {breadcrumbs.map((bc, i) => (
            <span key={i} className="flex items-center gap-1.5">
              <span>/</span>
              {bc.path ? (
                <Link to={bc.path} className="hover:text-slate-600">{bc.label}</Link>
              ) : (
                <span className="font-semibold text-slate-700">{bc.label}</span>
              )}
            </span>
          ))}
        </nav>
      )}
      <PageHeader
        title={title}
        subtitle={subtitle}
        actions={
          <>
            {apiControls}
            {actions}
          </>
        }
      />
      {children}
    </>
  )
}
