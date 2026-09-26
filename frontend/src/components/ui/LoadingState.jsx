export default function LoadingState({ label = 'Loading…' }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-14 text-ink-soft">
      <span className="h-6 w-6 rounded-full border-2 border-brand-400 border-t-transparent animate-spin" />
      <span className="text-sm">{label}</span>
    </div>
  )
}
