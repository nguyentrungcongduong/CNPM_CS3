import api from './axios';

const BASE = '/admin/stores';

export const storeService = {
  getAll: (params) => api.get(BASE, { params }),
  getList: () => api.get(`${BASE}/list`),
  getOne: (id) => api.get(`${BASE}/${id}`),
  create: (data) => api.post(BASE, data),
  update: (id, data) => api.put(`${BASE}/${id}`, data),
  delete: (id) => api.delete(`${BASE}/${id}`),
};
