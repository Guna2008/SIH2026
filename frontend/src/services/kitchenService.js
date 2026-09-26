import api from './api'

export const kitchenService = {
  getDashboard: () => api.get('/kitchen/dashboard').then((r) => r.data),
  getProduction: () => api.get('/kitchen/production').then((r) => r.data),
  recordProduction: (payload) => api.post('/kitchen/production', payload).then((r) => r.data),
  getMeals: () => api.get('/kitchen/meals').then((r) => r.data),
  createMeal: (payload) => api.post('/kitchen/meals', payload).then((r) => r.data),
  predictSurplus: (payload) => api.post('/kitchen/predictions/surplus', payload).then((r) => r.data),
  getSurplus: () => api.get('/kitchen/surplus').then((r) => r.data),
  createSurplus: (formData) => api.post('/kitchen/surplus', formData).then((r) => r.data),
  getDonations: () => api.get('/kitchen/donations').then((r) => r.data),
  verifyClaim: (claimId, pin) => api.post(`/claims/${claimId}/verify`, { pin }).then((r) => r.data),
  getAnalytics: () => api.get('/kitchen/analytics').then((r) => r.data),
  getProfile: () => api.get('/kitchen/profile').then((r) => r.data),
  updateProfile: (payload) => api.put('/kitchen/profile', payload).then((r) => r.data),
}
