import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AuthProvider } from '@/context/AuthContext'
import { ToastProvider } from '@/components/ui'
import DashboardLayout from '@/components/layout/DashboardLayout'
import TechLayout from '@/components/layout/TechLayout'
import ProtectedRoute from '@/routes/ProtectedRoute'
import adminRoutes from '@/routes/adminRoutes'
import salesRoutes from '@/routes/salesRoutes'
import operationsRoutes from '@/routes/operationsRoutes'
import techRoutes from '@/routes/techRoutes'
import customerRoutes from '@/routes/customerRoutes'
import Login from '@/pages/auth/Login'
import LandingPage from '@/pages/public/LandingPage'
import TrackOrder from '@/pages/public/TrackOrder'
import InvoicePrint from '@/pages/admin/InvoicePrint'
import NotFound from '@/pages/common/NotFound'
import { ROLES } from '@/constants/status'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            {/* Public pages (no login) */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/track" element={<TrackOrder />} />
            <Route path="/login" element={<Login />} />

            {/* Admin (Director) */}
            <Route element={<ProtectedRoute roles={[ROLES.ADMIN]} />}>
              <Route path="/admin" element={<DashboardLayout />}>{adminRoutes}</Route>
            </Route>

            {/* Printable invoice, full page without the sidebar (Admin, Sales, and customers for their own orders) */}
            <Route element={<ProtectedRoute roles={[ROLES.ADMIN, ROLES.SALES, ROLES.CUSTOMER]} />}>
              <Route path="/invoice/:type/:id" element={<InvoicePrint />} />
            </Route>

            {/* Sales / customer care */}
            <Route element={<ProtectedRoute roles={[ROLES.SALES]} />}>
              <Route path="/sales" element={<DashboardLayout />}>{salesRoutes}</Route>
            </Route>

            {/* Warehouse */}
            <Route element={<ProtectedRoute roles={[ROLES.WAREHOUSE]} />}>
              <Route path="/operations" element={<DashboardLayout />}>{operationsRoutes}</Route>
            </Route>

            {/* Technician (mobile layout, no sidebar) */}
            <Route element={<ProtectedRoute roles={[ROLES.TECHNICIAN]} />}>
              <Route path="/tech" element={<TechLayout />}>{techRoutes}</Route>
            </Route>

            {/* Customer portal (login emailed after their enquiry) */}
            <Route element={<ProtectedRoute roles={[ROLES.CUSTOMER]} />}>
              <Route path="/customer" element={<DashboardLayout />}>{customerRoutes}</Route>
            </Route>

            {/* Any other address */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
