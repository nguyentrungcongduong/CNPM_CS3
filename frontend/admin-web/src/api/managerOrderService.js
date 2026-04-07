import api from "./axios";

const BASE = "/manager/orders";

export const managerOrderService = {
  list: (params) => api.get(BASE, { params }),
};
