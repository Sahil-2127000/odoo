import api, { ApiError, mockDelay } from './axios'
import { mockUsers } from '@/mocks/users'

// Flip to false once Dev 1 ships POST /auth/login.
export const USE_MOCK = true

/**
 * Expected backend contract:
 *   POST /auth/login { email, password }
 *   -> { success: true, data: { token, user: { _id, name, email, role } }, message }
 */
export async function login({ email, password }) {
  if (USE_MOCK) {
    const user = mockUsers.find((u) => u.email.toLowerCase() === email.trim().toLowerCase())
    if (!user || !password) {
      await mockDelay(null, 300)
      throw new ApiError('Invalid email or password', 401)
    }
    return mockDelay({ token: `mock-token-${user.role}`, user })
  }
  return api.post('/auth/login', { email, password })
}

/** GET /auth/me -> user (optional; used to validate a stored token) */
export async function getMe() {
  if (USE_MOCK) return null
  return api.get('/auth/me')
}
