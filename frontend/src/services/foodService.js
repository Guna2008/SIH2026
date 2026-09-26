import api from './api'

export const foodService = {
  list: (params) => api.get('/food', { params }).then((r) => r.data),
  getById: (id) => api.get(`/food/${id}`).then((r) => r.data),
}
