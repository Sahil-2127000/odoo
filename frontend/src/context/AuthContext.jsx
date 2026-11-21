/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from 'react'
import { TOKEN_KEY, USER_KEY } from '@/api/axios'
import * as authApi from '@/api/auth'
import { ROLE_HOME } from '@/constants/status'

const AuthContext = createContext(null)

// Read the saved user from the browser (if any)
function savedUser() {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY))
  } catch {
    return null
  }
}

/**
 * Holds who is logged in. Wrap the app with <AuthProvider>, then in any component:
 *   const { user, token, login, logout } = useAuth()
 */
export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem(TOKEN_KEY))
  const [user, setUser] = useState(token ? savedUser() : null)

  // On page load, ask the backend (GET /auth/me) for fresh user details.
  // If the token is no longer valid, the API client logs out automatically.
  useEffect(() => {
    if (!token) return
    authApi
      .getMe()
      .then((freshUser) => {
        if (freshUser) setUser(freshUser)
      })
      .catch(() => {})
  }, [token])

  async function login(credentials) {
    const result = await authApi.login(credentials) // { token, user }
    localStorage.setItem(TOKEN_KEY, result.token)
    localStorage.setItem(USER_KEY, JSON.stringify(result.user))
    setToken(result.token)
    setUser(result.user)
    return result.user
  }

  function logout() {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    setToken(null)
    setUser(null)
  }

  const value = {
    user,
    token,
    role: user?.role,
    isAuthenticated: Boolean(token && user),
    homePath: ROLE_HOME[user?.role] || '/login', // where this user's dashboard is
    login,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}
