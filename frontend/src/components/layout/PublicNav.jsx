import { Link, NavLink } from 'react-router-dom'
import { Leaf } from 'lucide-react'

const LINKS = [
  { to: '/#how-it-works', label: 'How it works' },
  { to: '/#about', label: 'About' },
]

export default function PublicNav() {
  return (
    <header className="sticky top-0 z-40 bg-paper/90 backdrop-blur border-b border-line">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-display text-lg text-ink">
          <span className="h-7 w-7 rounded-sm bg-brand-600 text-white flex items-center justify-center">
            <Leaf size={15} />
          </span>
          Irai
        </Link>

        <nav className="hidden md:flex items-center gap-8 text-sm text-ink-soft">
          {LINKS.map((l) => (
            <a key={l.to} href={l.to} className="hover:text-ink transition-colors">
              {l.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3 text-sm">
          <Link
            to="/admin/login"
            className="bg-brand-600 text-white px-4 py-2 rounded-sm hover:bg-brand-700 transition-colors font-medium"
          >
            Login as admin
          </Link>
        </div>
      </div>
    </header>
  )
}
