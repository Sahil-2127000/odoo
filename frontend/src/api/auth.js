import api, { mockDelay } from './axios'
import { mockUsers } from '@/mocks/users'

// true = use fake users from src/mocks/users.js. false = real backend.
// true = use fake users from src/mocks/users.js. Set to false when the backend is running.
export const USE_MOCK = false

/** POST /auth/login { email, password } -> { token, user } */
export async function login({ email, password }) {
  if (USE_MOCK) {
    await mockDelay(null, 300)
    const user = mockUsers.find((u) => u.email === email.trim().toLowerCase())
    if (!user || !password) throw new Error('Invalid email or password')
    return { token: `mock-token-${user.role}`, user }
  }
  return api.post('/auth/login', { email, password })
}

/** GET /auth/me -> { user }. Checks that the saved token is still valid. */
export async function getMe() {
  if (USE_MOCK) return null
  const res = await api.get('/auth/me')
  return res.user
}
