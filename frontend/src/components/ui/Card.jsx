export default function Card({ className = '', accent, children, ...props }) {
  return (
    <div
      className={`bg-paper-raised border border-line rounded-md shadow-panel ${
        accent ? 'border-l-4' : ''
      } ${className}`}
      style={accent ? { borderLeftColor: accent } : undefined}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardHeader({ title, subtitle, action }) {
  return (
    <div className="flex items-start justify-between gap-4 px-5 pt-5">
      <div>
        <h3 className="font-display text-lg text-ink">{title}</h3>
        {subtitle && <p className="text-sm text-ink-soft mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}

export function CardBody({ className = '', children }) {
  return <div className={`px-5 py-5 ${className}`}>{children}</div>
}
