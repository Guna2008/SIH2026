import api from './api'

// Wired up fully in Module 10 (Matching Engine & Notifications).
export const notificationService = {
  list: () => api.get('/notifications').then((r) => r.data),
  markRead: (id) => api.post(`/notifications/${id}/read`).then((r) => r.data),
  markAllRead: () => api.post('/notifications/read-all').then((r) => r.data),
}
