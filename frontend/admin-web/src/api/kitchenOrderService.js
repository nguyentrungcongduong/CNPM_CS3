import api from './axios';

const BASE = '/kitchen/orders';

export const kitchenOrderService = {
  list:         (params) => api.get(BASE, { params }),
  getById:      (id)     => api.get(`${BASE}/${id}`),
  updateStatus: (id, data) => api.put(`${BASE}/${id}/status`, data),
};
