export default function EmptyState({ icon: Icon, title, message, action }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center border border-dashed border-line rounded-md">
      {Icon && (
        <div className="h-11 w-11 rounded-full bg-paper-sunken flex items-center justify-center">
          <Icon size={20} className="text-ink-soft" />
        </div>
      )}
      <div>
        <p className="text-sm font-medium text-ink">{title}</p>
        {message && <p className="text-xs text-ink-soft mt-1 max-w-sm">{message}</p>}
      </div>
      {action}
    </div>
  )
}
