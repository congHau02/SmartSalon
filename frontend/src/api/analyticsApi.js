import { axiosClient } from "./axiosClient";
import { tokenStorage } from "../lib/tokenStorage";

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

  getInventoryAlertsReport: async (branchId, startDate, endDate) => {
    const params = {};
    if (branchId) params.branchId = branchId;
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    const response = await axiosClient.get("/analytics/inventory-alerts", { params });
    return response?.result || response?.data || response;
  },

  updateStaffBaseSalary: async (staffId, baseSalary) => {
    const response = await axiosClient.patch(`/analytics/staff/${staffId}/base-salary`, {
      baseSalary: Number(baseSalary),
    });
    return response?.result || response?.data || response;
  },

  exportReport: async (reportType, format, branchId, startDate, endDate) => {
    const params = new URLSearchParams();
    if (branchId) params.append("branchId", branchId);
    if (startDate) params.append("startDate", startDate);
    if (endDate) params.append("endDate", endDate);

    const token = tokenStorage.getAccessToken();
    const queryString = params.toString() ? `?${params.toString()}` : "";
    const url = `/api/v1/analytics/export/${reportType}/${format}${queryString}`;

    const res = await fetch(url, {
      method: "GET",
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    if (!res.ok) {
      const errorText = await res.text().catch(() => "");
      throw new Error(errorText || `Xuất báo cáo thất bại (HTTP ${res.status})`);
    }

    const disposition = res.headers.get("content-disposition");
    let filename = `Bao_Cao_${reportType}_${startDate}_${endDate}.${format}`;
    if (disposition && disposition.includes("filename=")) {
      const match = disposition.match(/filename="?([^";]+)"?/);
      if (match && match[1]) {
        filename = match[1].trim();
      }
    }

    const blob = await res.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);

    return { filename, size: blob.size };
  },
};
