import api from './api'

// Wired up fully in Module 4 (Organization Registration & Admin Verification)
// and extended through Modules 7–11 for food/claims/inventory/analytics oversight.
export const adminService = {
  getOrganizations: (params) => api.get('/admin/organizations', { params }).then((r) => r.data),
  getOrganization: (id) => api.get(`/admin/organizations/${id}`).then((r) => r.data),
  approveOrganization: (id, reason) =>
    api.post(`/admin/organizations/${id}/approve`, { reason }).then((r) => r.data),
  rejectOrganization: (id, reason) =>
    api.post(`/admin/organizations/${id}/reject`, { reason }).then((r) => r.data),
  getFood: () => api.get('/admin/food').then((r) => r.data),
  getClaims: () => api.get('/admin/claims').then((r) => r.data),
  getInventory: () => api.get('/admin/inventory').then((r) => r.data),
  getAnalytics: (params) => api.get('/admin/analytics', { params }).then((r) => r.data),
  getReports: () => api.get('/admin/reports').then((r) => r.data),
}
