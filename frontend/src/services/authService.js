import api, { setStoredToken } from './api'

// Wires up to the backend built in Module 3 (Authentication & Authorization).
// Kept isolated here so no component talks to /auth/* directly.

export async function signup(payload) {
  // payload: { role, email, password, name, phone, address, ...roleSpecificFields }
  const { data } = await api.post('/auth/signup', payload)
  return data
}

export async function login({ email, password, latitude, longitude }) {
  const { data } = await api.post('/auth/login', { email, password, latitude, longitude })
  if (data?.access_token) setStoredToken(data.access_token)
  return data
}

export async function adminLogin({ email, password }) {
  const { data } = await api.post('/auth/admin/login', { email, password })
  if (data?.access_token) setStoredToken(data.access_token)
  return data
}

export async function getCurrentUser() {
  const { data } = await api.get('/auth/me')
  return data
}

export function logout() {
  setStoredToken(null)
}
