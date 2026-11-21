// Owner: Dev 3 (Sales). Edit freely — add/remove items for your pages.
// Each item: { label, to, icon (lucide-react), end?: true for exact match }
import { ClipboardCheck, FileText, IndianRupee, LayoutDashboard, PackageCheck, UserPlus, Users } from 'lucide-react'

const navSales = [
  { label: 'Dashboard', to: '/sales', icon: LayoutDashboard, end: true },
  { label: 'Leads', to: '/sales/leads', icon: UserPlus },
  { label: 'Customers', to: '/sales/customers', icon: Users },
  { label: 'Site Surveys', to: '/sales/surveys', icon: ClipboardCheck },
  { label: 'Quotations', to: '/sales/quotations', icon: FileText },
  { label: 'Orders', to: '/sales/orders', icon: PackageCheck },
  { label: 'Payments', to: '/sales/payments', icon: IndianRupee },
]

export default navSales
