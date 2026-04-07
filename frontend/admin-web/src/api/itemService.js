import api from './axios';

export const itemService = {
  // Lấy danh sách hàng hóa
  getItems: (params = {}) => api.get('/manager/items', { params }),

  // Lấy chi tiết hàng hóa
  getItem: (id) => api.get(`/manager/items/${id}`),

  // Tạo hàng hóa mới
  createItem: (data) => api.post('/manager/items', data),

  // Cập nhật hàng hóa
  updateItem: (id, data) => api.put(`/manager/items/${id}`, data),

  // Xóa hàng hóa
  deleteItem: (id) => api.delete(`/manager/items/${id}`),
};
