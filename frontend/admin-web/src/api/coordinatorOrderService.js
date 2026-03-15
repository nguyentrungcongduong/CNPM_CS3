import api from './axios';

const BASE = '/coordinator/orders';

export const coordinatorOrderService = {
  list:    (params) => api.get(BASE, { params }),
  confirm: (id, data) => api.put(`${BASE}/${id}/confirm`, data ?? {}),
  reject:  (id, data) => api.put(`${BASE}/${id}/reject`, data ?? {}),
};
