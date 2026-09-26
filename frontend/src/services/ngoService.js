import api from './api'

export const ngoService = {
  getAvailableFood: () => api.get('/ngo/food').then((r) => r.data),
  getClaims: () => api.get('/ngo/claims').then((r) => r.data),
  getProfile: () => api.get('/ngo/profile').then((r) => r.data),
  updateProfile: (payload) => api.put('/ngo/profile', payload).then((r) => r.data),
}
