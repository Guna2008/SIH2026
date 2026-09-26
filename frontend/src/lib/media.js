const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'
export function mediaUrl(path) {
  if (!path) return null
  return path.startsWith('http') ? path : `${API_BASE}${path}`
}
