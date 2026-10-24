import { axiosClient } from "./axiosClient";

export const customerApi = {
  getLoyaltyPreview: async (phone) => {
    if (!phone) return null;
    const response = await axiosClient.get("/customers/loyalty-preview", {
      params: { phone },
    });
    return response?.result || response?.data || response;
  },
};
