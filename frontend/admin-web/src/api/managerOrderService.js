import api from './axios';

const BASE = '/manager/orders';

export const managerOrderService = {
  list: (params) => api.get(BASE, { params }),
  approve: (id) => api.patch(`${BASE}/${id}/approve`),
  reject: (id, data) => api.patch(`${BASE}/${id}/reject`, data),
};

