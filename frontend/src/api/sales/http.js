/**
 * Sales API mode switch (Mock DB <-> real backend).
 *
 * - Real mode talks to the Express backend through the shared axios client (`@/api/axios`),
 *   via the adapters in ./backend.js.
 * - Mock mode uses the localStorage mock DB in src/mocks/sales.
 *
 * Default: mock while the app is logged in with a mock token (backend not running),
 * real once the user has logged in against the real backend. The toggle in PageShell
 * can override it per browser.
 */
import { TOKEN_KEY } from '@/api/axios'

const MODE_KEY = 'SUNPOWER_SALES_USE_MOCK'

/** True when the current login came from the mock users (no real JWT). */
export const isMockSession = () => {
  if (typeof window === 'undefined') return true
  const token = localStorage.getItem(TOKEN_KEY)
  return !token || token.startsWith('mock-token')
}

export const isGlobalMockEnabled = () => {
  if (typeof window === 'undefined') return true
  // A mock login has no valid JWT, so the real backend would reject every call.
  if (isMockSession()) return true
  const val = localStorage.getItem(MODE_KEY)
  if (val !== null) return val === 'true'
  return false
}

export const setGlobalMockEnabled = (enabled) => {
  if (typeof window === 'undefined') return
  localStorage.setItem(MODE_KEY, enabled ? 'true' : 'false')
  window.dispatchEvent(new Event('sales_mock_toggle'))
}

export default { isGlobalMockEnabled, setGlobalMockEnabled, isMockSession }
