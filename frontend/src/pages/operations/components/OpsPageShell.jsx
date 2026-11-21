// Temporary page frame for Phase 0 shells.
// Replace with Dev 2's PageHeader / Card components once the UI kit lands.
export default function OpsPageShell({ title, description, phase, todo = [], children }) {
  return (
    <div className="space-y-6">
      <header>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
          {phase && (
            <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">{phase}</span>
          )}
        </div>
        {description && <p className="mt-1 text-sm text-slate-600">{description}</p>}
      </header>

      {children}

      {todo.length > 0 && (
        <section className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4">
          <h2 className="text-sm font-medium text-slate-700">Planned on this page</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-600">
            {todo.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}

export function ShellStatus({ loading, error, children }) {
  if (loading) return <p className="text-sm text-slate-500">Loading...</p>
  if (error) return <p className="text-sm text-red-600">Error: {error}</p>
  return children
}

export function StatCard({ label, value, tone = 'slate' }) {
  const tones = {
    slate: 'text-slate-900',
    red: 'text-red-600',
    amber: 'text-amber-600',
    green: 'text-emerald-600',
    blue: 'text-sky-600',
  }
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className={`mt-1 text-2xl font-semibold ${tones[tone]}`}>{value}</p>
    </div>
  )
}
