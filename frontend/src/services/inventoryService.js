import api from './api'

// Wired up fully in Module 5 (Kitchen Inventory Management).
export const inventoryService = {
  list: () => api.get('/kitchen/inventory').then((r) => r.data),
  create: (payload) => api.post('/kitchen/inventory', payload).then((r) => r.data),
  update: (id, payload) => api.put(`/kitchen/inventory/${id}`, payload).then((r) => r.data),
  remove: (id) => api.delete(`/kitchen/inventory/${id}`).then((r) => r.data),
  listBatches: (itemId) => api.get(`/kitchen/inventory/${itemId}/batches`).then((r) => r.data),
  addBatch: (itemId, payload) => api.post(`/kitchen/inventory/${itemId}/batches`, payload).then((r) => r.data),
  scanExpiry: (formData) => api.post('/kitchen/inventory/scan-expiry', formData).then((r) => r.data),
  expiryRecommendations: () => api.get('/kitchen/inventory/expiry-recommendations').then((r) => r.data),
}
