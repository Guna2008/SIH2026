import { AlertTriangle } from 'lucide-react'

export default function ErrorState({ title = 'Something went wrong', message, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-14 text-center border border-dashed border-clay-100 rounded-md bg-clay-50/40">
      <AlertTriangle size={22} className="text-clay-400" />
      <div>
        <p className="text-sm font-medium text-ink">{title}</p>
        {message && <p className="text-xs text-ink-soft mt-1 max-w-sm">{message}</p>}
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="text-xs font-medium text-brand-600 hover:text-brand-700 underline underline-offset-2"
        >
          Try again
        </button>
      )}
    </div>
  )
}
