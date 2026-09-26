const VARIANTS = {
  primary: 'bg-brand-600 text-white hover:bg-brand-700 border border-brand-600',
  secondary: 'bg-transparent text-ink hover:bg-paper-sunken border border-line',
  gold: 'bg-gold-400 text-ink hover:bg-gold-500 border border-gold-400',
  danger: 'bg-clay-400 text-white hover:bg-clay-500 border border-clay-400',
  ghost: 'bg-transparent text-brand-700 hover:bg-brand-50 border border-transparent',
}

const SIZES = {
  sm: 'text-sm px-3 py-1.5',
  md: 'text-sm px-4 py-2.5',
  lg: 'text-base px-5 py-3',
}

export default function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  as: Component = 'button',
  disabled = false,
  loading = false,
  children,
  ...props
}) {
  return (
    <Component
      className={`inline-flex items-center justify-center gap-2 rounded-sm font-medium tracking-wide transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <span className="h-3.5 w-3.5 rounded-full border-2 border-current border-t-transparent animate-spin" />
      )}
      {children}
    </Component>
  )
}
