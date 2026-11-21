// Temporary app shell so the Operations module runs on its own.
// Dev 2 will replace this with the real router (login, role guards, /admin, /sales, /operations).
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom'
import OpsDevLayout from './pages/operations/components/OpsDevLayout'
import { operationsRoutes } from './routes/operationsRoutes'

const router = createBrowserRouter([
  { path: '/', element: <Navigate to="/operations" replace /> },
  { path: '/operations', element: <OpsDevLayout />, children: operationsRoutes },
  { path: '*', element: <Navigate to="/operations" replace /> },
])

export default function App() {
  return <RouterProvider router={router} />
}
