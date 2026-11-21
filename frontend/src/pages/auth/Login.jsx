import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Lock, Mail, Sun } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { USE_MOCK } from '@/api/auth'
import { ROLE_HOME } from '@/constants/status'
import { mockUsers } from '@/mocks/users'
import { Button, Input } from '@/components/ui'

export default function Login() {
  const { login, isAuthenticated, homePath } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (isAuthenticated) return <Navigate to={homePath} replace />

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }))

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const user = await login(form)
      const from = location.state?.from?.pathname
      const home = ROLE_HOME[user.role] ?? '/login'
      // Only return to the previous page if it belongs to this role's portal
      navigate(from && from.startsWith(home) ? from : home, { replace: true })
    } catch (err) {
      setError(err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* Brand panel */}
      <div className="relative hidden flex-1 flex-col justify-between overflow-hidden bg-ink-900 p-12 text-white lg:flex">
        <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-primary-500/20 blur-3xl" />
        <div className="relative flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-500">
            <Sun className="h-6 w-6" />
          </div>
          <span className="text-lg font-semibold">SunPower Solutions</span>
        </div>
        <div className="relative max-w-md">
          <h2 className="text-3xl leading-tight font-semibold text-white">
            From the first quote to the 20-year warranty.
          </h2>
          <p className="mt-4 text-slate-400">
            Leads, site surveys, quotations, inventory, installations and service — in one place.
          </p>
        </div>
        <p className="relative text-xs text-slate-500">Solar Installation Management System</p>
      </div>

      {/* Form */}
      <div className="flex flex-1 items-center justify-center px-4 py-12 sm:px-8">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-500">
              <Sun className="h-5 w-5 text-white" />
            </div>
            <span className="font-semibold text-slate-900">SunPower Solutions</span>
          </div>

          <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
          <p className="mt-1 text-sm text-slate-500">Use your work account to continue.</p>

          <form onSubmit={onSubmit} className="mt-8 space-y-4">
            <Input
              label="Email"
              name="email"
              type="email"
              icon={Mail}
              autoComplete="email"
              placeholder="you@sunpower.com"
              value={form.email}
              onChange={onChange}
              required
            />
            <Input
              label="Password"
              name="password"
              type="password"
              icon={Lock}
              autoComplete="current-password"
              placeholder="••••••••"
              value={form.password}
              onChange={onChange}
              required
            />
            {error && (
              <div className="rounded-control border border-danger-500/30 bg-danger-50 px-3 py-2 text-sm text-danger-700">
                {error}
              </div>
            )}
            <Button type="submit" fullWidth loading={loading} size="lg">
              Sign in
            </Button>
          </form>

          {USE_MOCK && (
            <div className="mt-8 rounded-card border border-dashed border-slate-300 p-4">
              <p className="text-xs font-semibold text-slate-500 uppercase">Mock mode — demo accounts</p>
              <div className="mt-2 space-y-1">
                {mockUsers.map((u) => (
                  <button
                    key={u._id}
                    type="button"
                    onClick={() => setForm({ email: u.email, password: 'demo' })}
                    className="block w-full cursor-pointer rounded px-2 py-1 text-left text-sm text-slate-600 hover:bg-slate-100"
                  >
                    <span className="font-medium capitalize">{u.role}</span> · {u.email}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
