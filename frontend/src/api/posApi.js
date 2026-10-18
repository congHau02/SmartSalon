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

  addServiceItem: async (orderId, data) => {
    const response = await axiosClient.post(`/pos/orders/${orderId}/items/service`, data);
    return response?.result || response?.data || response;
  },

  addProductItem: async (orderId, data) => {
    const response = await axiosClient.post(`/pos/orders/${orderId}/items/product`, data);
    return response?.result || response?.data || response;
  },

  updateOrder: async (orderId, data) => {
    const response = await axiosClient.patch(`/pos/orders/${orderId}`, data);
    return response?.result || response?.data || response;
  },

  removeOrderItem: async (orderId, itemId) => {
    const response = await axiosClient.delete(`/pos/orders/${orderId}/items/${itemId}`);
    return response?.result || response?.data || response;
  },

  updateStepAssignment: async (orderId, stepId, data) => {
    const response = await axiosClient.patch(`/pos/orders/${orderId}/steps/${stepId}`, data);
    return response?.result || response?.data || response;
  },

  updateStepStatus: async (orderId, stepId, data) => {
    const response = await axiosClient.patch(`/pos/orders/${orderId}/steps/${stepId}/status`, data);
    return response?.result || response?.data || response;
  },

  getVisualLog: async (orderId) => {
    const response = await axiosClient.get(`/pos/orders/${orderId}/visual-log`);
    return response?.result || response?.data || response;
  },

  saveVisualLog: async (orderId, data) => {
    const response = await axiosClient.put(`/pos/orders/${orderId}/visual-log`, data);
    return response?.result || response?.data || response;
  },

  uploadMedia: async (formData) => {
    const response = await axiosClient.post("/pos/media/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response?.result || response?.data || response;
  },

  checkoutOrder: async (orderId, data) => {
    const response = await axiosClient.post(`/pos/orders/${orderId}/checkout`, data);
    return response?.result || response?.data || response;
  },

  getPosVietQr: async (orderId, discountAmount) => {
    const response = await axiosClient.get(`/pos/orders/${orderId}/vietqr`, {
      params: discountAmount !== undefined && discountAmount !== null ? { discountAmount } : undefined,
    });
    return response?.result || response?.data || response;
  },

  getCommissionLedger: async (branchId, date) => {
    const params = { branchId };
    if (date) params.date = date;
    const response = await axiosClient.get("/pos/commission-ledger", { params });
    return response?.result || response?.data || response;
  },
};
