import api from './axios';

const BASE = '/admin/users';

export const userService = {
  getAll: (params) => api.get(BASE, { params }),
  getOne: (id) => api.get(`${BASE}/${id}`),
  create: (data) => api.post(BASE, data),
  update: (id, data) => api.put(`${BASE}/${id}`, data),
  delete: (id) => api.delete(`${BASE}/${id}`),
};

export const roleService = {
  getAll: () => api.get('/admin/roles'),
};
