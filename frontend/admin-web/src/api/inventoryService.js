import api from './axios';

export const inventoryService = {
  getKitchenStock: (params) => api.get('/manager/inventory', { params }),
  getKitchenTransactions: (params) => api.get('/manager/inventory/transactions', { params }),
  getStoreStock: (storeId, params) => api.get(`/store/inventory/${storeId}`, { params }),
  getStoreTransactions: (storeId, params) => api.get(`/store/inventory/${storeId}/transactions`, { params }),
};
