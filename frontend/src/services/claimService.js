import api from './api'

export const claimService = {
  claim: (foodListingId, quantity) => api.post('/claims', { food_listing_id: foodListingId, quantity }).then((r) => r.data),
  list: () => api.get('/claims').then((r) => r.data),
}
