import api from './axios';

export const inventoryService = {
  getKitchenStock: (params) => api.get('/manager/inventory', { params }),
  getKitchenTransactions: (params) => api.get('/manager/inventory/transactions', { params }),
  getBatches: (params) => api.get('/manager/batches', { params }),
  createBatch: (data) => api.post('/manager/batches', data),
  getBatchByCode: (code) => api.get(`/manager/batches/${code}`),
  getStoreStock: (storeId, params) => api.get(`/store/inventory/${storeId}`, { params }),
  getStoreTransactions: (storeId, params) => api.get(`/store/inventory/${storeId}/transactions`, { params }),
};
