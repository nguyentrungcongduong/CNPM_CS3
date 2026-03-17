import api from './axios';

export const devService = {
  resetData: () => api.post('/dev/reset-data'),
};

