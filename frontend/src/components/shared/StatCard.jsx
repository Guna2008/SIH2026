import Card from '../ui/Card'

export default function StatCard({ label, value, hint, icon: Icon, accent = '#16834A' }) {
  return (
    <Card>
      <div className="p-5 flex items-start justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-ink-soft/80 font-medium mb-2">{label}</p>
          <p className="font-display text-3xl text-ink">{value}</p>
          {hint && <p className="text-xs text-ink-soft mt-1.5">{hint}</p>}
        </div>
        {Icon && (
          <span
            className="h-10 w-10 rounded-sm flex items-center justify-center shrink-0"
            style={{ backgroundColor: `${accent}1A`, color: accent }}
          >
            <Icon size={18} />
          </span>
        )}
      </div>
    </Card>
  )
}
