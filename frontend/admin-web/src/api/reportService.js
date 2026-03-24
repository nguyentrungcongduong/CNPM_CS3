import api from './axios';

export const reportService = {
  getDashboard: () => api.get('/manager/dashboard'),
  getInventoryReport: () => api.get('/manager/reports/inventory'),
  getProductionReport: (range = 'weekly') => api.get('/manager/reports/production', { params: { range } }),
};

