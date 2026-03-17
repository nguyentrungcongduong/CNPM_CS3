import api from './axios';

const BASE = '/coordinator/deliveries';

export const deliveryService = {
  // Danh sách đơn READY chờ lên lịch giao
  readyOrders: () => api.get('/coordinator/orders/ready'),

  // Danh sách lịch giao (filter: status, date_from, date_to, per_page)
  list: (params) => api.get(BASE, { params }),

  // Chi tiết lịch giao
  get: (id) => api.get(`${BASE}/${id}`),

  // Tạo lịch giao + gán đơn hàng
  // data: { scheduled_date, scheduled_time?, driver_name?, driver_phone?, vehicle_plate?, note?, order_ids[] }
  create: (data) => api.post(BASE, data),

  // Cập nhật trạng thái lịch giao
  // status: 'IN_TRANSIT' | 'DELIVERED' | 'CANCELLED'
  updateStatus: (id, status, note) => api.patch(`${BASE}/${id}/status`, { status, note }),
};
