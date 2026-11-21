import axios from 'axios'

// Keys used to save the login in the browser
export const TOKEN_KEY = 'solarconnect_token'
export const USER_KEY = 'solarconnect_user'

// One shared Axios instance for the whole app. Never create another one.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000/api/v1',
})

// 1) Before every request: attach the login token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY)
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// 2) After every response
api.interceptors.response.use(
  // Success: the backend sends { success, message, data }. We return just `data`.
  // (Login sends { token, user } without `data`, so then we return the whole body.)
  (res) => (res.data?.data !== undefined ? res.data.data : res.data),

  // Error: turn it into a normal Error with a readable message
  (error) => {
    const status = error.response?.status
    const message = error.response?.data?.message || 'Cannot reach the server. Please try again.'

    // Token expired or invalid -> log out and go to the login page
    if (status === 401 && !error.config.url.includes('/auth/login')) {
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(USER_KEY)
      window.location.assign('/login')
    }

    return Promise.reject(new Error(message))
  },
)

/** Waits a little and returns a copy of `data`. Used to fake API calls with mock data. */
export const mockDelay = (data, ms = 300) =>
  new Promise((resolve) => setTimeout(() => resolve(structuredClone(data)), ms))

export default api
