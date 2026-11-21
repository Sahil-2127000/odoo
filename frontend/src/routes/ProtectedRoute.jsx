import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'

/**
 * Guards a route subtree.
 *   <Route element={<ProtectedRoute roles={['admin']} />}> ... </Route>
 * - not logged in       -> /login (remembers where you were going)
 * - logged in, wrong role -> your own dashboard
 */
export default function ProtectedRoute({ roles }) {
  const { isAuthenticated, role, homePath } = useAuth()
  const location = useLocation()

  if (!isAuthenticated) return <Navigate to="/login" replace state={{ from: location }} />
  if (roles && !roles.includes(role)) return <Navigate to={homePath} replace />
  return <Outlet />
}
