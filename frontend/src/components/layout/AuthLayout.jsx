import { Link } from 'react-router-dom'
import { Leaf } from 'lucide-react'

export default function AuthLayout({ eyebrow, title, subtitle, children, footer, wide = false }) {
  return (
    <div className="min-h-screen bg-paper flex flex-col">
      <div className="px-6 py-5">
        <Link to="/" className="inline-flex items-center gap-2 font-display text-lg text-ink">
          <span className="h-7 w-7 rounded-sm bg-brand-600 text-white flex items-center justify-center">
            <Leaf size={15} />
          </span>
          Irai
        </Link>
      </div>

      <div className="flex-1 flex items-center justify-center px-6 py-10">
        <div className={`w-full ${wide ? 'max-w-2xl' : 'max-w-md'}`}>
          <div className="auth-card bg-paper-raised border border-line rounded-md shadow-panel p-8">
            {eyebrow && (
              <p className="text-xs font-medium tracking-wide uppercase text-brand-600 mb-3">
                {eyebrow}
              </p>
            )}
            <h1 className="font-display text-2xl text-ink mb-1.5">{title}</h1>
            {subtitle && <p className="text-sm text-ink-soft mb-7">{subtitle}</p>}
            {children}
          </div>
          {footer && <div className="text-center mt-6 text-sm text-ink-soft">{footer}</div>}
        </div>
      </div>
    </div>
  )
}
