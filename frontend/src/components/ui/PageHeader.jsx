export default function PageHeader({ title, description, action }) {
  return (
    <div className="flex items-start justify-between gap-4 mb-6">
      <div>
        <h2 className="font-display text-xl text-ink">{title}</h2>
        {description && <p className="text-sm text-ink-soft mt-1 max-w-xl">{description}</p>}
      </div>
      {action}
    </div>
  )
}
