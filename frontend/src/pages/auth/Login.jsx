import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Lock, Mail, Sun } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { ROLE_HOME, ROLE_LABELS } from '@/constants/status'
import { mockUsers } from '@/mocks/users'
import { Button, Input } from '@/components/ui'

// Password of the demo accounts created by the backend seed
const DEMO_PASSWORD = 'password123'

// One login page for staff and customers. After login each role goes to its own portal.
export default function Login() {
  const { login, isAuthenticated, homePath } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Already logged in? Go straight to the dashboard.
  if (isAuthenticated) return <Navigate to={homePath} replace />

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const user = await login(form)
      navigate(ROLE_HOME[user.role] || '/', { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* Left: dark brand panel (large screens only) */}
      <div className="relative hidden flex-1 flex-col justify-between overflow-hidden bg-slate-950 p-12 text-white lg:flex">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_10%,rgba(249,115,22,0.35),transparent_45%)]" />
        <Link to="/" className="relative flex items-center gap-2 font-display text-3xl font-extrabold uppercase">
          <Sun className="h-6 w-6 text-amber-400" /> SolarConnect
        </Link>
        <div className="relative max-w-md">
          <h2 className="font-display text-6xl leading-[0.9] font-extrabold text-white uppercase">
            From the first enquiry to the <span className="font-serif font-normal text-amber-300 normal-case italic">20-year warranty.</span>
          </h2>
          <p className="mt-4 text-slate-400">Leads, surveys, quotes, stock, installations and service tickets in one place.</p>
        </div>
        <p className="relative text-xs text-slate-500">Solar Installation Management System</p>
      </div>

      {/* Right: login form */}
      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          <Link to="/" className="mb-8 flex items-center gap-2 font-display text-3xl font-extrabold text-slate-900 uppercase lg:hidden">
            <Sun className="h-6 w-6 text-amber-400" /> SolarConnect
          </Link>

          <h1 className="font-display text-5xl font-extrabold uppercase">Log in</h1>
          <p className="mt-1 text-sm text-slate-500">
            Staff use their work email. Customers use the email and password we sent after your enquiry.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <Input label="Email" name="email" type="email" icon={Mail} value={form.email} onChange={handleChange} required />
            <Input
              label="Password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              icon={Lock}
              value={form.password}
              onChange={handleChange}
              required
              trailing={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="cursor-pointer rounded p-1.5 text-slate-400 hover:text-slate-700"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              }
            />
            {error && <p className="bg-danger-50 px-3 py-2 text-sm text-danger-700">{error}</p>}
            <Button type="submit" fullWidth size="lg" loading={loading}>
              Log in
            </Button>
          </form>

          {/* Demo accounts: click one to fill the form */}
          <div className="mt-8 border border-dashed border-slate-300 p-4">
            <p className="text-xs font-semibold text-slate-500 uppercase">Demo accounts · password {DEMO_PASSWORD}</p>
            <div className="mt-2 space-y-1">
              {mockUsers.map((u) => (
                <button
                  key={u.email}
                  type="button"
                  onClick={() => setForm({ email: u.email, password: DEMO_PASSWORD })}
                  className="flex w-full justify-between px-2 py-1.5 text-left text-sm text-slate-600 hover:bg-slate-100"
                >
                  <span className="font-medium text-slate-900">{ROLE_LABELS[u.role]}</span>
                  <span>{u.email}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
