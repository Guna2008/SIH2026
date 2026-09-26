import { forwardRef } from 'react'

const Select = forwardRef(function Select(
  { label, error, hint, options = [], className = '', ...props },
  ref
) {
  return (
    <label className="block">
      {label && <span className="block text-sm font-medium text-ink mb-1.5">{label}</span>}
      <select
        ref={ref}
        className={`w-full rounded-sm border bg-paper-raised px-3.5 py-2.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-brand-400 transition-colors ${
          error ? 'border-clay-300' : 'border-line'
        } ${className}`}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {hint && !error && <span className="block text-xs text-ink-soft mt-1.5">{hint}</span>}
      {error && <span className="block text-xs text-clay-500 mt-1.5">{error}</span>}
    </label>
  )
})

export default Select
