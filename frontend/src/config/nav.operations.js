// Owner: Dev 4 (Operations). Edit freely — add/remove items for your pages.
// Each item: { label, to, icon (lucide-react), end?: true for exact match }
import { Boxes, CalendarCheck, HardHat, LayoutDashboard, LifeBuoy, Package, ShieldCheck } from 'lucide-react'

const navOperations = [
  { label: 'Dashboard', to: '/operations', icon: LayoutDashboard, end: true },
  { label: 'Products', to: '/operations/products', icon: Package },
  { label: 'Inventory', to: '/operations/inventory', icon: Boxes },
  { label: 'Installations', to: '/operations/installations', icon: CalendarCheck },
  { label: 'Technicians', to: '/operations/technicians', icon: HardHat },
  { label: 'Warranty', to: '/operations/warranty', icon: ShieldCheck },
  { label: 'Service Tickets', to: '/operations/tickets', icon: LifeBuoy },
]

export default navOperations
