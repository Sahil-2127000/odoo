// Real-API helper for the Operations module.
// Uses the team's single shared Axios instance (src/api/axios.js), which adds the login token,
// unwraps { success, data, message } to `data`, and turns failures into an Error with the message.
import api from '../axios'

export async function http(method, path, body) {
  return api.request({ method, url: path, data: body })
}

// Mock calls return the same envelope; this unwraps it the same way the Axios interceptor does.
export const unwrap = (res) => {
  if (!res?.success) throw new Error(res?.message || 'Request failed')
  return res.data
}

export const toQuery = (params = {}) => {
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
  return entries.length ? `?${new URLSearchParams(entries)}` : ''
}
