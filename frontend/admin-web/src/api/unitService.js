import api from "./axios";

const ADMIN_BASE = "/admin/units";
const MANAGER_BASE = "/manager/units";

export const unitService = {
  // Read-only for manager (GET /api/manager/units)
  getAllForManager: () => api.get(MANAGER_BASE),

  // Admin CRUD (GET/POST/PUT/DELETE /api/admin/units)
  getAllForAdmin: () => api.get(ADMIN_BASE),
  create: (data) => api.post(ADMIN_BASE, data),
  update: (id, data) => api.put(`${ADMIN_BASE}/${id}`, data),
  delete: (id) => api.delete(`${ADMIN_BASE}/${id}`),
};
