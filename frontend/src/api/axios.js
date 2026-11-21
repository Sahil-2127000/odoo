import axios from 'axios'

export const TOKEN_KEY = 'sunpower_token'
export const USER_KEY = 'sunpower_user'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: { 'Content-Type': 'application/json' },
})

// Attach JWT
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY)
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Unwrap { success, data, message } and normalise errors.
// Usage: const leads = await api.get('/leads')   // -> data, not the axios response
api.interceptors.response.use(
  (res) => {
    const body = res.data
    if (body && typeof body === 'object' && 'success' in body) {
      if (body.success === false) {
        return Promise.reject(new ApiError(body.message || 'Request failed', res.status))
      }
      return body.data
    }
    return body
  },
  (error) => {
    const status = error.response?.status
    const message =
      error.response?.data?.message ||
      (error.code === 'ERR_NETWORK' ? 'Cannot reach the server' : error.message) ||
      'Something went wrong'

    // Expired / invalid token -> drop session and go to login
    if (status === 401 && !error.config?.url?.includes('/auth/login')) {
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(USER_KEY)
      if (window.location.pathname !== '/login') window.location.assign('/login')
    }
    return Promise.reject(new ApiError(message, status))
  },
)

export class ApiError extends Error {
  constructor(message, status) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

/** Simulates network latency for mock responses. */
export const mockDelay = (data, ms = 300) =>
  new Promise((resolve) => setTimeout(() => resolve(structuredClone(data)), ms))

export default api
