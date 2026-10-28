import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { bookingApi } from "./bookingApi";
import { axiosClient } from "../../api/axiosClient";

export const BOOKING_QUERY_KEYS = {
  branches: ["branches", "active"],
  services: ["services", "active"],
  stylists: (branchId, date) => ["booking", "stylists", branchId, date || ""],
  availableSlots: (branchId, date, serviceIds, stylistId) => [
    "booking",
    "slots",
    branchId,
    date,
    serviceIds ? [...serviceIds].sort().join(",") : "",
    stylistId || "any",
  ],
  detail: (code) => ["booking", "detail", code],
  paymentInfo: (code) => ["booking", "payment-info", code],
  lookup: (phone) => ["booking", "lookup", phone],
  adminList: (filters) => ["booking", "admin-list", filters],
};

// Hook lấy danh sách Chi nhánh đang hoạt động
export function useActiveBranches() {
  return useQuery({
    queryKey: BOOKING_QUERY_KEYS.branches,
    queryFn: async () => {
      const res = await axiosClient.get("/branches");
      const list = res?.result || res?.data || [];
      return list.filter((b) => !b.isDeleted);
    },
    staleTime: 5 * 60 * 1000,
  });
}

// Hook lấy danh sách Dịch vụ đang hoạt động
export function useActiveServices() {
  return useQuery({
    queryKey: BOOKING_QUERY_KEYS.services,
    queryFn: async () => {
      const res = await axiosClient.get("/services");
      const list = res?.result || res?.data || [];
      return list.filter((s) => s.isActive !== false);
    },
    staleTime: 5 * 60 * 1000,
  });
}

// Hook lấy danh sách Stylist theo chi nhánh
export function useBookingStylists(branchId, date) {
  return useQuery({
    queryKey: BOOKING_QUERY_KEYS.stylists(branchId, date),
    queryFn: () => bookingApi.getStylists(branchId, date),
    enabled: Boolean(branchId),
    staleTime: 5 * 60 * 1000,
  });
}

// Hook tính toán khung giờ trống (Slot 30 phút)
export function useAvailableSlots({ branchId, date, serviceIds, stylistId }, options = {}) {
  const hasRequiredParams = Boolean(branchId && date && serviceIds?.length > 0);

  return useQuery({
    queryKey: BOOKING_QUERY_KEYS.availableSlots(branchId, date, serviceIds, stylistId),
    queryFn: () => bookingApi.getAvailableSlots({ branchId, date, serviceIds, stylistId }),
    enabled: hasRequiredParams && (options.enabled !== undefined ? options.enabled : true),
    staleTime: 10 * 1000, // Khung giờ cập nhật thường xuyên
    refetchOnWindowFocus: true,
    ...options,
  });
}

// Hook đặt giữ chỗ 5 phút
export function useCreateBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => bookingApi.createBooking(data),
    onSuccess: (data) => {
      // Invalidate available slots so other clients see locked state
      queryClient.invalidateQueries({ queryKey: ["booking", "slots"] });
    },
  });
}

// Hook tra cứu chi tiết lịch hẹn
export function useBookingDetail(code, options = {}) {
  return useQuery({
    queryKey: BOOKING_QUERY_KEYS.detail(code),
    queryFn: () => bookingApi.getBookingByCode(code),
    enabled: Boolean(code),
    staleTime: 30 * 1000,
    ...options,
  });
}

// Hook lấy thông tin thanh toán VietQR / PayOS
export function usePaymentInfo(code, options = {}) {
  return useQuery({
    queryKey: BOOKING_QUERY_KEYS.paymentInfo(code),
    queryFn: () => bookingApi.getPaymentInfo(code),
    enabled: Boolean(code),
    staleTime: 60 * 1000,
    ...options,
  });
}

// Hook tra cứu lịch hẹn theo số điện thoại
export function useLookupBookings(phone, options = {}) {
  return useQuery({
    queryKey: BOOKING_QUERY_KEYS.lookup(phone),
    queryFn: () => bookingApi.lookupBookings(phone),
    enabled: Boolean(phone && phone.length >= 10),
    staleTime: 30 * 1000,
    ...options,
  });
}

// Hook mô phỏng thanh toán Sandbox (One-click)
export function useSimulateDepositWebhook() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (bookingCode) => bookingApi.simulateDepositWebhook(bookingCode),
    onSuccess: (data, bookingCode) => {
      queryClient.invalidateQueries({ queryKey: BOOKING_QUERY_KEYS.detail(bookingCode) });
      queryClient.invalidateQueries({ queryKey: BOOKING_QUERY_KEYS.paymentInfo(bookingCode) });
      queryClient.invalidateQueries({ queryKey: ["booking", "admin-list"] });
    },
  });
}

// Hook quản lý danh sách lịch hẹn (Admin / Manager)
export function useAdminBookings(filters = {}) {
  return useQuery({
    queryKey: BOOKING_QUERY_KEYS.adminList(filters),
    queryFn: () => bookingApi.getBookings(filters),
    staleTime: 30 * 1000,
  });
}

// Hook cập nhật trạng thái lịch hẹn
export function useUpdateBookingStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, statusData }) => bookingApi.updateBookingStatus(id, statusData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["booking"] });
    },
  });
}
