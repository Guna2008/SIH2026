import { Bell, LogOut, ChevronDown, RefreshCw, UserCheck, Shield } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { ROLE_HOME_ROUTE, ROLE_TITLE } from '../../lib/roles'
import Badge from '../ui/Badge'

const DEMO_ROLES = [
  { role: 'KITCHEN', label: 'Institutional Kitchen', email: 'kct@gmail.com' },
  { role: 'FOOD_BANK', label: 'Food Bank', email: 'food@gmail.com' },
  { role: 'NGO', label: 'Social Welfare (NGO)', email: 'nalam@gmail.com' },
  { role: 'ORPHANAGE', label: 'Social Welfare (Orphanage)', email: 'orphanage@gmail.com' },
  { role: 'BIOGAS_PLANT', label: 'Biogas Plant', email: 'biogas@gmail.com' },
  { role: 'INDIVIDUAL', label: 'Individual / Hall', email: 'durai@gmail.com' },
  { role: 'ADMIN', label: 'Platform Admin', email: 'admin@tenet.com' },
]

export default function Topbar({ title }) {
  const { user, role, logout, switchAccount } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [switching, setSwitching] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const handleRoleSwitch = async (email, targetRole) => {
    setSwitching(true)
    const ok = await switchAccount(email)
    setSwitching(false)
    setMenuOpen(false)
    if (ok) {
      const dest = ROLE_HOME_ROUTE[targetRole] || '/'
      navigate(dest)
    }
  }

  return (
    <header className="dashboard-topbar h-16 border-b border-line bg-paper/95 backdrop-blur sticky top-0 z-30 flex items-center justify-between px-6">
      <div className="flex items-center gap-3 min-w-0">
        <h1 className="font-display text-xl text-ink truncate">{title}</h1>
        {role && (
          <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-brand-50 text-brand-700 border border-brand-200">
            {role}
          </span>
        )}
      </div>

      <div className="flex items-center gap-3">
        <div className="relative">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            disabled={switching}
            className="flex items-center gap-2 pl-2 pr-2 py-1.5 rounded border border-line bg-white hover:bg-paper-sunken shadow-sm transition-colors"
          >
            <span className="h-7 w-7 rounded-full bg-brand-600 text-white flex items-center justify-center text-xs font-semibold">
              {(user?.email || 'U')[0].toUpperCase()}
            </span>
            <div className="hidden md:flex flex-col text-left">
              <span className="text-xs font-semibold text-ink leading-tight">{user?.name || user?.email || 'Account'}</span>
              <span className="text-[10px] text-ink-soft leading-tight">{role || 'User'}</span>
            </div>
            <ChevronDown size={14} className="text-ink-soft" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-white border border-line rounded-lg shadow-xl py-2 z-50 animate-in fade-in zoom-in-95">
              <div className="px-3 py-2 border-b border-line">
                <p className="text-xs font-semibold text-ink">{user?.name || 'Current User'}</p>
                <p className="text-[11px] text-ink-soft truncate">{user?.email}</p>
                <span className="mt-1 inline-block text-[10px] uppercase font-bold tracking-wider text-brand-700 bg-brand-50 px-1.5 py-0.5 rounded">
                  {role}
                </span>
              </div>

              <div className="py-1">
                <div className="px-3 py-1 text-[10px] font-semibold text-ink-soft uppercase tracking-wider">
                  Switch Active Role (Live Demo)
                </div>
                {DEMO_ROLES.map((item) => (
                  <button
                    key={item.role}
                    onClick={() => handleRoleSwitch(item.email, item.role)}
                    className={`w-full flex items-center justify-between px-3 py-1.5 text-xs text-left transition-colors ${
                      role === item.role ? 'bg-brand-50 text-brand-800 font-semibold' : 'text-ink-soft hover:bg-paper-sunken hover:text-ink'
                    }`}
                  >
                    <span>{item.label}</span>
                    {role === item.role && <span className="h-1.5 w-1.5 rounded-full bg-brand-600"></span>}
                  </button>
                ))}
              </div>

              <div className="pt-1 border-t border-line">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-clay-600 hover:bg-clay-50 text-left transition-colors"
                >
                  <LogOut size={14} /> Log out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
