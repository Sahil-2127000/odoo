// Owner: Sales (Rakhi). Edit freely — add/remove items for your pages.
// Each item: { label, to, icon (lucide-react), end?: true for exact match }
import { CalendarClock, ClipboardList, LifeBuoy, ShoppingCart, Users } from 'lucide-react'

const navSales = [
  { label: 'Enquiries', to: '/sales', icon: ClipboardList, end: true },
  { label: "Today's follow-ups", to: '/sales/follow-ups', icon: CalendarClock },
  { label: 'Customers', to: '/sales/customers', icon: Users },
  { label: 'Orders', to: '/sales/orders', icon: ShoppingCart },
  { label: 'Complaints', to: '/sales/complaints', icon: LifeBuoy },
]

export default navSales
