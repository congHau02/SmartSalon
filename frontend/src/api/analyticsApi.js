import { axiosClient } from "./axiosClient";

export const analyticsApi = {
  getPnlReport: async (branchId, startDate, endDate) => {
    const params = {};
    if (branchId) params.branchId = branchId;
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    const response = await axiosClient.get("/analytics/pnl", { params });
    return response?.result || response?.data || response;
  },

  getStaffPayrollReport: async (branchId, startDate, endDate) => {
    const params = {};
    if (branchId) params.branchId = branchId;
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    const response = await axiosClient.get("/analytics/staff-payroll", { params });
    return response?.result || response?.data || response;
  },

  updateStaffBaseSalary: async (staffId, baseSalary) => {
    const response = await axiosClient.put(`/analytics/staff/${staffId}/base-salary`, {
      baseSalary: Number(baseSalary),
    });
    return response?.result || response?.data || response;
  },
};
