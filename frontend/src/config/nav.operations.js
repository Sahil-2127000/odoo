// Sidebar items for the Operations role. Paths are absolute.
// `icon` is a lucide-react icon name; Dev 2's layout maps it to a component.
export const operationsNav = [
  { label: 'Overview', path: '/operations', icon: 'LayoutDashboard', end: true },
  { label: 'Products', path: '/operations/products', icon: 'Package' },
  { label: 'Inventory', path: '/operations/inventory', icon: 'Warehouse' },
  { label: 'Serial Lookup', path: '/operations/serials', icon: 'ScanSearch' },
  { label: 'Orders to Fulfil', path: '/operations/fulfilment', icon: 'ClipboardCheck' },
  { label: 'Installations', path: '/operations/installations', icon: 'Wrench' },
  { label: 'Technicians', path: '/operations/technicians', icon: 'HardHat' },
  { label: 'Warranties', path: '/operations/warranties', icon: 'ShieldCheck' },
  { label: 'Service Tickets', path: '/operations/tickets', icon: 'LifeBuoy' },
]
