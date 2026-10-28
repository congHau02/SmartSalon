import { axiosClient } from "./axiosClient";

export const shiftApi = {
  getTemplates: async (branchId) => {
    const params = branchId ? { branchId } : {};
    const response = await axiosClient.get("/shifts/templates", { params });
    return response?.result || response?.data || response;
  },

  createTemplate: async (data) => {
    const response = await axiosClient.post("/shifts/templates", data);
    return response?.result || response?.data || response;
  },

  updateTemplate: async (id, data) => {
    const response = await axiosClient.put(`/shifts/templates/${id}`, data);
    return response?.result || response?.data || response;
  },

  getWeeklyRoster: async (branchId, startDate, endDate) => {
    const params = {};
    if (branchId) params.branchId = branchId;
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    const response = await axiosClient.get("/shifts/roster", { params });
    return response?.result || response?.data || response;
  },

  updateRoster: async (data) => {
    const response = await axiosClient.put("/shifts/roster", data);
    return response?.result || response?.data || response;
  },

  copyWeekRoster: async (data) => {
    const response = await axiosClient.post("/shifts/roster/copy-week", data);
    return response?.result || response?.data || response;
  },
};
