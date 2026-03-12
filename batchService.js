import axios from './axios';

const batchService = {
    getBatches: (params) => axios.get('/manager/batches', { params }),
    createBatch: (data) => axios.post('/manager/batches', data),
    getBatchByLot: (batchNumber) => axios.get(`/manager/batches/lot/${batchNumber}`),
    getAlerts: (params) => axios.get('/manager/alerts', { params }),
};

export default batchService;
