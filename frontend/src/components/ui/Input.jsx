import { forwardRef } from 'react'

const Input = forwardRef(function Input({ label, error, hint, className = '', ...props }, ref) {
  return (
    <label className="block">
      {label && <span className="block text-sm font-medium text-ink mb-1.5">{label}</span>}
      <input
        ref={ref}
        className={`w-full rounded-sm border bg-paper-raised px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-soft/50 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-brand-400 transition-colors ${
          error ? 'border-clay-300' : 'border-line'
        } ${className}`}
        {...props}
      />
      {hint && !error && <span className="block text-xs text-ink-soft mt-1.5">{hint}</span>}
      {error && <span className="block text-xs text-clay-500 mt-1.5">{error}</span>}
    </label>
  )
})

export default Input
