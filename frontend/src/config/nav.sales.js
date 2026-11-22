// Owner: Sales (Rakhi). Edit freely — add/remove items for your pages.
// Each item: { label, to, icon (lucide-react), end?: true for exact match }
import {
  CalendarClock,
  ClipboardCheck,
  ClipboardList,
  FileText,
  History,
  IndianRupee,
  LayoutDashboard,
  LifeBuoy,
  PackageCheck,
  ShoppingCart,
  UserPlus,
  Users,
} from 'lucide-react'

const navSales = [
  { label: 'Enquiries', to: '/sales', icon: ClipboardList, end: true },
  { label: "Today's follow-ups", to: '/sales/follow-ups', icon: CalendarClock },
  { label: 'Sales overview', to: '/sales/dashboard', icon: LayoutDashboard },
  { label: 'Leads', to: '/sales/leads', icon: UserPlus },
  { label: 'Customers', to: '/sales/customers', icon: Users },
  { label: 'Customer history', to: '/sales/customer-history', icon: History },
  { label: 'Site Surveys', to: '/sales/surveys', icon: ClipboardCheck },
  { label: 'Quotations', to: '/sales/quotations', icon: FileText },
  { label: 'Orders', to: '/sales/orders', icon: PackageCheck },
  { label: 'Kit orders', to: '/sales/kit-orders', icon: ShoppingCart },
  { label: 'Payments', to: '/sales/payments', icon: IndianRupee },
  { label: 'Complaints', to: '/sales/complaints', icon: LifeBuoy },
]

export default navSales
