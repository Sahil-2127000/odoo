// Sidebar of the customer portal.
import { LifeBuoy, ShieldCheck, ShoppingBag } from 'lucide-react'

const navCustomer = [
  { label: 'My orders', to: '/customer', icon: ShoppingBag, end: true },
  { label: 'Warranty', to: '/customer/warranty', icon: ShieldCheck },
  { label: 'Complaints', to: '/customer/complaints', icon: LifeBuoy },
]

export default navCustomer
