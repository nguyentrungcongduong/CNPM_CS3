import api from './axios';

const BASE = '/store/orders';

export const storeOrderService = {
  list: (params) => api.get(BASE, { params }),
  create: (data) => api.post(BASE, data),
  getById: (id) => api.get(`${BASE}/${id}`),
};

