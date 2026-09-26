import api from './api'

export const orphanageService = {
  getRequirements: () => api.get('/orphanage/requirements').then((r) => r.data),
  createRequirement: (payload) => api.post('/orphanage/requirements', payload).then((r) => r.data),
  getAvailableFood: () => api.get('/orphanage/food').then((r) => r.data),
  getClaims: () => api.get('/orphanage/claims').then((r) => r.data),
  getProfile: () => api.get('/orphanage/profile').then((r) => r.data),
  updateProfile: (payload) => api.put('/orphanage/profile', payload).then((r) => r.data),
}

