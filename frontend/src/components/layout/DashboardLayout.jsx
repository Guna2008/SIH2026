import Sidebar from './Sidebar'
import Topbar from './Topbar'

export default function DashboardLayout({ role, title, children }) {
  return (
    <div className="min-h-screen flex bg-paper">
      <Sidebar role={role} />
      <div className="flex-1 min-w-0">
        <Topbar title={title} />
        <main className="dashboard-main px-6 py-8 max-w-6xl">{children}</main>
      </div>
    </div>
  )
}
