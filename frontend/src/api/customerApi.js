import { axiosClient } from "./axiosClient";

export const customerApi = {
  getLoyaltyPreview: async (phone) => {
    if (!phone) return null;
    const response = await axiosClient.get("/customers/loyalty-preview", {
      params: { phone },
    });
    return response?.result || response?.data || response;
  },

  getMySummary: async () => {
    const response = await axiosClient.get("/customer/me/summary");
    return response?.result || response?.data || response;
  },

  getMyBookings: async () => {
    const response = await axiosClient.get("/customer/me/bookings");
    return response?.result || response?.data || response || [];
  },

  cancelMyBooking: async (bookingId) => {
    const response = await axiosClient.post(`/customer/me/bookings/${bookingId}/cancel`);
    return response?.result || response?.data || response;
  },

  getMyOrders: async () => {
    const response = await axiosClient.get("/customer/me/orders");
    return response?.result || response?.data || response || [];
  },

  submitServiceReview: async (orderId, payload) => {
    const response = await axiosClient.post(`/customer/me/orders/${orderId}/review`, payload);
    return response?.result || response?.data || response;
  },
};
