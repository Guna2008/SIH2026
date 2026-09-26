import { NavLink } from 'react-router-dom'
import { Leaf } from 'lucide-react'
import { NAV_CONFIG, ROLE_TITLE } from './navConfig'

export default function Sidebar({ role }) {
  const items = NAV_CONFIG[role] || []

  return (
    <>
      <aside className="hidden lg:flex flex-col w-64 shrink-0 border-r border-line bg-paper-raised h-screen sticky top-0">
        <div className="h-16 flex items-center gap-2 px-6 border-b border-line">
          <span className="h-7 w-7 rounded-sm bg-brand-600 text-white flex items-center justify-center">
            <Leaf size={15} />
          </span>
          <span className="font-display text-base text-ink">Irai</span>
        </div>

        <div className="px-6 pt-5 pb-2">
          <span className="text-xs uppercase tracking-wider text-ink-soft/70 font-medium">
            {ROLE_TITLE[role]}
          </span>
        </div>

        <nav className="flex-1 px-3 py-2 space-y-0.5">
          {items.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-sm text-sm transition-colors ${isActive
                  ? 'bg-brand-50 text-brand-700 font-medium'
                  : 'text-ink-soft hover:bg-paper-sunken hover:text-ink'
                }`
              }
            >
              <Icon size={17} />
              {label}
            </NavLink>
          ))}
        </nav>


      </aside>
      <nav aria-label="Mobile navigation" className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-paper-raised/95 backdrop-blur border-t border-line flex overflow-x-auto safe-bottom">
        {items.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} end className={({ isActive }) => `flex flex-col items-center justify-center gap-1 min-w-[76px] flex-1 px-2 py-2 text-[10px] ${isActive ? 'text-brand-700 font-semibold' : 'text-ink-soft'}`}>
            <Icon size={19} strokeWidth={1.8} />
            <span className="max-w-full truncate">{label}</span>
          </NavLink>
        ))}
      </nav>
    </>
  )
}
