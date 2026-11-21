// Owner: Warehouse (Raman). Edit freely — add/remove items for your pages.
// Each item: { label, to, icon (lucide-react), end?: true for exact match }
import { Boxes, CalendarClock, ShieldCheck, Truck } from 'lucide-react'

const navOperations = [
  { label: 'Stock', to: '/operations', icon: Boxes, end: true },
  { label: 'Orders to process', to: '/operations/orders', icon: Truck },
  { label: 'Installations', to: '/operations/installations', icon: CalendarClock },
  { label: 'Warranties', to: '/operations/warranties', icon: ShieldCheck },
]

export default navOperations
