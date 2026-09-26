import axios from 'axios'

// Single Axios instance for the entire application.
// No component should import axios directly — always go through a *Service module.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  },
})

const TOKEN_KEY = 'foodshare_token'

export function getStoredToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function setStoredToken(token) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token)
  } else {
    localStorage.removeItem(TOKEN_KEY)
  }
}

// Attach the JWT (if present) to every outgoing request.
api.interceptors.request.use((config) => {
  if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
    delete config.headers['Content-Type']
  }
  const token = getStoredToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Normalize backend errors and handle expired/invalid sessions centrally.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status
    const detail = error?.response?.data?.detail

    if (status === 401) {
      setStoredToken(null)
      // Let the AuthContext / ProtectedRoute react to the missing token on next render
      // instead of forcing a hard redirect here, to avoid surprising the user mid-action.
    }

    const message =
      typeof detail === 'string'
        ? detail
        : Array.isArray(detail)
        ? detail.map((d) => d.msg).join(', ')
        : error?.message || 'Something went wrong. Please try again.'

    return Promise.reject({ status, message, raw: error })
  }
)

export default api
