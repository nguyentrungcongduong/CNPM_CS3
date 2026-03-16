import api from './axios';

const BASE = '/coordinator/orders';

export const coordinatorOrderService = {
  // Lấy danh sách đơn hàng (có phân trang, filter theo status/store/date)
  list: (params) => api.get(BASE, { params }),

  // Tổng hợp nhu cầu từ tất cả cửa hàng
  summary: (params) => api.get(`${BASE}/summary`, { params }),

  // Xác nhận đơn (SUBMITTED → CONFIRMED)
  confirm: (id, data) => api.put(`${BASE}/${id}/confirm`, data ?? {}),

  // Từ chối đơn (SUBMITTED → REJECTED)
  reject: (id, data) => api.put(`${BASE}/${id}/reject`, data ?? {}),

  // Hủy đơn (CONFIRMED → CANCELLED)
  cancel: (id, data) => api.put(`${BASE}/${id}/cancel`, data ?? {}),

  // Điều chỉnh số lượng phê duyệt (xử lý thiếu hàng)
  adjustQuantities: (id, data) => api.put(`${BASE}/${id}/adjust-quantities`, data),
};
