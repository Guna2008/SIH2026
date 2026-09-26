import { MapPin } from 'lucide-react'

export default function LocationMap({ latitude, longitude, title = 'Kitchen location' }) {
  if (latitude == null || longitude == null) return null

  const lat = Number(latitude)
  const lng = Number(longitude)
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null

  const delta = 0.012
  const bbox = `${lng - delta},${lat - delta},${lng + delta},${lat + delta}`
  const src = `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(bbox)}&layer=mapnik&marker=${encodeURIComponent(`${lat},${lng}`)}`
  const fullMapUrl = `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=16/${lat}/${lng}`

  return (
    <div className="rounded-sm border border-line overflow-hidden bg-paper-raised">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-line">
        <MapPin size={16} className="text-brand-700" />
        <div className="font-medium text-sm">{title}</div>
      </div>
      <iframe
        title={title}
        src={src}
        className="w-full h-72 border-0"
        loading="lazy"
      />
      <div className="px-4 py-3 flex flex-wrap items-center justify-between gap-3 text-xs text-ink-soft">
        <span>OpenStreetMap preview · {lat.toFixed(5)}, {lng.toFixed(5)}</span>
        <a href={fullMapUrl} target="_blank" rel="noreferrer" className="text-brand-700 font-medium hover:underline">
          Open larger map
        </a>
      </div>
    </div>
  )
}
