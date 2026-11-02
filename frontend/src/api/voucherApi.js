import { axiosClient } from "./axiosClient";

export const voucherApi = {
  getVouchers: async () => {
    const response = await axiosClient.get("/admin/vouchers");
    return response?.result || response?.data || response;
  },

  getVoucherById: async (id) => {
    const response = await axiosClient.get(`/admin/vouchers/${id}`);
    return response?.result || response?.data || response;
  },

  createVoucher: async (data) => {
    const response = await axiosClient.post("/admin/vouchers", data);
    return response?.result || response?.data || response;
  },

  updateVoucher: async (id, data) => {
    const response = await axiosClient.put(`/admin/vouchers/${id}`, data);
    return response?.result || response?.data || response;
  },

  toggleVoucherActive: async (id, active) => {
    const response = await axiosClient.patch(`/admin/vouchers/${id}/active`, { active });
    return response?.result || response?.data || response;
  },
};
