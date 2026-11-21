// Sidebar links for the Admin (Director). Owner: Frontend 1.
// Each item: { label, to, icon (lucide-react), end: true = only active on exact path }
import { Boxes, FileText, LayoutDashboard, Package, Users } from 'lucide-react'

const navAdmin = [
  { label: 'Overview', to: '/admin', icon: LayoutDashboard, end: true },
  { label: 'Products', to: '/admin/products', icon: Package },
  { label: 'Kits', to: '/admin/kits', icon: Boxes },
  { label: 'Users', to: '/admin/users', icon: Users },
  { label: 'Invoices', to: '/admin/invoices', icon: FileText },
]

export default navAdmin
