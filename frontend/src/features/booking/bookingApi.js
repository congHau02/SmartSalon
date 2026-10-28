import { axiosClient } from "../../api/axiosClient";

export const bookingApi = {
  // Lấy danh sách kỹ thuật viên đang hoạt động theo chi nhánh và ca trực theo ngày
  getStylists: async (branchId, date) => {
    const params = {};
    if (branchId) params.branchId = branchId;
    if (date) params.date = date;
    const response = await axiosClient.get("/bookings/stylists", { params });
    return response?.result ?? response ?? [];
  },

  // Tính toán các khung giờ trống khả dụng (Slot 30 phút)
  getAvailableSlots: async ({ branchId, date, serviceIds, stylistId }) => {
    if (!branchId || !date || !serviceIds?.length) {
      return null;
    }
    const params = {
      branchId,
      date,
      serviceIds: Array.isArray(serviceIds) ? serviceIds.join(",") : serviceIds,
    };
    if (stylistId) {
      params.stylistId = stylistId;
    }
    const response = await axiosClient.get("/bookings/available-slots", { params });
    return response?.result ?? response;
  },

  // Giữ chỗ lịch hẹn 5 phút (Redis Multi-Bucket Lock) và tạo đơn đặt chỗ
  createBooking: async (bookingData) => {
    const response = await axiosClient.post("/bookings", bookingData);
    return response?.result ?? response;
  },

  // Tra cứu chi tiết lịch hẹn bằng mã đặt hẹn (BK-xxxx)
  getBookingByCode: async (code) => {
    if (!code) return null;
    const response = await axiosClient.get(`/bookings/code/${code}`);
    return response?.result ?? response;
  },

  // Lấy thông tin thanh toán VietQR và link checkout PayOS
  getPaymentInfo: async (code) => {
    if (!code) return null;
    const response = await axiosClient.get(`/bookings/${code}/payment-info`);
    return response?.result ?? response;
  },

  // Tra cứu danh sách lịch hẹn của khách hàng qua số điện thoại
  lookupBookings: async (phone) => {
    if (!phone) return [];
    const response = await axiosClient.get("/bookings/lookup", { params: { phone } });
    return response?.result ?? response ?? [];
  },

  // Mô phỏng thanh toán Sandbox một chạm (One-click Testing)
  simulateDepositWebhook: async (bookingCode) => {
    if (!bookingCode) return null;
    const response = await axiosClient.post(`/webhooks/payos/simulate/${bookingCode}`);
    return response?.result ?? response;
  },

  // Quản lý lịch hẹn (Admin / Manager / Staff)
  getBookings: async ({ branchId, status, date, search } = {}) => {
    const params = {};
    if (branchId) params.branchId = branchId;
    if (status) params.status = status;
    if (date) params.date = date;
    if (search) params.search = search;
    const response = await axiosClient.get("/bookings", { params });
    return response?.result ?? response ?? [];
  },

  // Cập nhật trạng thái lịch hẹn
  updateBookingStatus: async (id, statusData) => {
    const response = await axiosClient.patch(`/bookings/${id}/status`, statusData);
    return response?.result ?? response;
  },
};
