import { axiosClient } from "./axiosClient";

export const posApi = {
  getDispatchBoard: async (branchId, date) => {
    const params = { branchId };
    if (date) params.date = date;
    const response = await axiosClient.get("/pos/dispatch-board", { params });
    return response?.result || response?.data || response;
  },

  checkInBooking: async (bookingId) => {
    const response = await axiosClient.post(`/pos/bookings/${bookingId}/check-in`);
    return response?.result || response?.data || response;
  },

  createWalkInOrder: async (data) => {
    const response = await axiosClient.post("/pos/orders/walk-in", data);
    return response?.result || response?.data || response;
  },

  getOrderById: async (orderId) => {
    const response = await axiosClient.get(`/pos/orders/${orderId}`);
    return response?.result || response?.data || response;
  },

  getServices: async () => {
    const response = await axiosClient.get("/services", { params: { activeOnly: true } });
    return response?.result || response?.data || [];
  },

  getProducts: async () => {
    const response = await axiosClient.get("/products", { params: { activeOnly: true } });
    return response?.result || response?.data || [];
  },

  getStylists: async (branchId) => {
    const response = await axiosClient.get("/bookings/stylists", { params: { branchId } });
    return response?.result || response?.data || [];
  },
};
