import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AuthProvider } from '@/context/AuthContext'
import DashboardLayout from '@/components/layout/DashboardLayout'
import ProtectedRoute from '@/routes/ProtectedRoute'
import adminRoutes from '@/routes/adminRoutes'
import salesRoutes from '@/routes/salesRoutes'
import operationsRoutes from '@/routes/operationsRoutes'
import Login from '@/pages/auth/Login'
import LandingPage from '@/pages/public/LandingPage'
import TrackOrder from '@/pages/public/TrackOrder'
import NotFound from '@/pages/common/NotFound'
import { ROLES } from '@/constants/status'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public customer-facing routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/track" element={<TrackOrder />} />
          <Route path="/login" element={<Login />} />

          {/* Internal Staff Portals */}
          <Route element={<ProtectedRoute roles={[ROLES.ADMIN]} />}>
            <Route path="/admin" element={<DashboardLayout />}>
              {adminRoutes}
            </Route>
          </Route>

          <Route element={<ProtectedRoute roles={[ROLES.SALES]} />}>
            <Route path="/sales" element={<DashboardLayout />}>
              {salesRoutes}
            </Route>
          </Route>

          <Route element={<ProtectedRoute roles={[ROLES.OPERATIONS]} />}>
            <Route path="/operations" element={<DashboardLayout />}>
              {operationsRoutes}
            </Route>
          </Route>

          {/* 404 Fallback */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
