export function parseServerDate(value) {
  if (!value) return null
  if (value instanceof Date) return value
  let str = String(value).trim()
  if (!str.includes('Z') && !/[+-]\d{2}:?\d{2}$/.test(str) && str.includes('T')) {
    str += 'Z'
  }
  const date = new Date(str)
  return Number.isNaN(date.getTime()) ? null : date
}

export function formatDateTime(value) {
  const date = parseServerDate(value)
  if (!date) return '—'
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit', month: 'short', year: 'numeric',
    hour: 'numeric', minute: '2-digit', hour12: true,
  }).format(date)
}

export function formatDate(value) {
  const date = parseServerDate(value)
  if (!date) return '—'
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit', month: 'short', year: 'numeric',
  }).format(date)
}

export function formatTimeOnly(value) {
  const date = parseServerDate(value)
  if (!date) return '—'
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour: 'numeric', minute: '2-digit', hour12: true,
  }).format(date)
}

export function formatMeal(value) {
  if (!value) return '—'
  return value.charAt(0) + value.slice(1).toLowerCase()
}

export function mapsUrl(lat, lng) {
  if (lat == null || lng == null) return null
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`
}
