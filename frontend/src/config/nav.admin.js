// Owner: Dev 2 (Admin). Sidebar items for the admin role.
import { BarChart3, FileSpreadsheet, FolderKanban, LayoutDashboard, Users } from 'lucide-react'

const navAdmin = [
  { label: 'Overview', to: '/admin', icon: LayoutDashboard, end: true },
  { label: 'Projects', to: '/admin/projects', icon: FolderKanban },
  { label: 'Financials', to: '/admin/analytics', icon: BarChart3 },
  { label: 'Team', to: '/admin/team', icon: Users },
  { label: 'Reports', to: '/admin/reports', icon: FileSpreadsheet },
]

export default navAdmin
