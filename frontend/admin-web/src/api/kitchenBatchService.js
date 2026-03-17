import api from './axios';

export const kitchenBatchService = {
  create: (data) => api.post('/kitchen/batch/create', data),
};

