import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'

/**
 * Only lets the given roles in.
 *   <Route element={<ProtectedRoute roles={['admin']} />}> ...admin pages... </Route>
 * - not logged in  -> sent to /login
 * - wrong role     -> sent to their own dashboard
 */
export default function ProtectedRoute({ roles }) {
  const { isAuthenticated, role, homePath } = useAuth()

  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (!roles.includes(role)) return <Navigate to={homePath} replace />
  return <Outlet /> // show the page inside
}
