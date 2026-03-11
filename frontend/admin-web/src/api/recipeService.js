import api from './axios';

const BASE = '/admin/recipes';

export const recipeService = {
  getRecipes: () => api.get(BASE),
  createRecipe: (data) => api.post(BASE, data),
  updateRecipe: (id, data) => api.put(`${BASE}/${id}`, data),
  deleteRecipe: (id) => api.delete(`${BASE}/${id}`),

  // Helper to fetch items for ingredient selector
  getItems: () => api.get('/admin/items'),
};

