// Thin fetch wrapper for the real Express API.
// Every response is { success, data, message }; callers get `data` or an Error.
// TODO: switch to the shared client from Dev 2 (src/api/client.js) once it lands.

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5000/api'

export const unwrap = (res) => {
  if (!res?.success) throw new Error(res?.message || 'Request failed')
  return res.data
}

export async function http(method, path, body) {
  const token = localStorage.getItem('token')
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  let json
  try {
    json = await res.json()
  } catch {
    json = { success: false, message: `HTTP ${res.status}` }
  }
  return unwrap(json)
}

export const toQuery = (params = {}) => {
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
  return entries.length ? `?${new URLSearchParams(entries)}` : ''
}
