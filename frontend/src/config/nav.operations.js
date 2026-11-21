// Owner: Dev 4 (Operations). Edit freely — add/remove items for your pages.
// Each item: { label, to, icon (lucide-react), end?: true for exact match }
import { Boxes, ClipboardCheck, HardHat, LayoutDashboard, LifeBuoy, Package, ScanSearch, ShieldCheck, Wrench } from 'lucide-react'

const navOperations = [
  { label: 'Overview', to: '/operations', icon: LayoutDashboard, end: true },
  { label: 'Products', to: '/operations/products', icon: Package },
  { label: 'Inventory', to: '/operations/inventory', icon: Boxes },
  { label: 'Serial Lookup', to: '/operations/serials', icon: ScanSearch },
  { label: 'Orders to Fulfil', to: '/operations/fulfilment', icon: ClipboardCheck },
  { label: 'Installations', to: '/operations/installations', icon: Wrench },
  { label: 'Technicians', to: '/operations/technicians', icon: HardHat },
  { label: 'Warranties', to: '/operations/warranties', icon: ShieldCheck },
  { label: 'Service Tickets', to: '/operations/tickets', icon: LifeBuoy },
]

export default navOperations
