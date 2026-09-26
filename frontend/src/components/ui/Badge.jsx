const TONES = {
  neutral: 'bg-paper-sunken text-ink-soft border-line',
  brand: 'bg-brand-50 text-brand-700 border-brand-200',
  gold: 'bg-gold-50 text-gold-600 border-gold-200',
  success: 'bg-brand-50 text-brand-700 border-brand-200',
  warning: 'bg-gold-50 text-gold-600 border-gold-200',
  danger: 'bg-clay-50 text-clay-500 border-clay-100',
}

export default function Badge({ tone = 'neutral', children, className = '' }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-sm border px-2 py-0.5 text-xs font-medium ${TONES[tone]} ${className}`}
    >
      {children}
    </span>
  )
}
