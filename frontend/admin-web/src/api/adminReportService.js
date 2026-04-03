import api from "./axios";

export const adminReportService = {
  getOverview: () => api.get("/admin/overview"),
};
