import axios from './axios';

const API_URL = '/kitchen';

export const getProductionPlans = async (params) => {
    return await axios.get(`${API_URL}/production-plan`, { params });
};

export const createProductionPlan = async (data) => {
    return await axios.post(`${API_URL}/production-plan`, data);
};

export const checkIngredients = async (id) => {
    return await axios.get(`${API_URL}/production-plan/${id}/ingredients`);
};

export const updateProductionStatus = async (id, status) => {
    return await axios.put(`${API_URL}/production/${id}/status`, { status });
};

export const deleteProductionPlan = async (id) => {
    return await axios.delete(`${API_URL}/production-plan/${id}`);
};
