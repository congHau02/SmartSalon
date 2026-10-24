import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { customerApi } from "../../api/customerApi";

export const CUSTOMER_QUERY_KEYS = {
  summary: ["customer", "summary"],
  bookings: ["customer", "bookings"],
  orders: ["customer", "orders"],
};

export function useCustomerSummary(enabled = true) {
  return useQuery({
    queryKey: CUSTOMER_QUERY_KEYS.summary,
    queryFn: () => customerApi.getMySummary(),
    enabled,
    staleTime: 60 * 1000,
  });
}

export function useCustomerBookings(enabled = true) {
  return useQuery({
    queryKey: CUSTOMER_QUERY_KEYS.bookings,
    queryFn: () => customerApi.getMyBookings(),
    enabled,
    staleTime: 30 * 1000,
  });
}

export function useCancelCustomerBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (bookingId) => customerApi.cancelMyBooking(bookingId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CUSTOMER_QUERY_KEYS.bookings });
      queryClient.invalidateQueries({ queryKey: CUSTOMER_QUERY_KEYS.summary });
      queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
    },
  });
}

export function useCustomerOrders(enabled = true) {
  return useQuery({
    queryKey: CUSTOMER_QUERY_KEYS.orders,
    queryFn: () => customerApi.getMyOrders(),
    enabled,
    staleTime: 30 * 1000,
  });
}

export function useSubmitServiceReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ orderId, payload }) => customerApi.submitServiceReview(orderId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CUSTOMER_QUERY_KEYS.orders });
      queryClient.invalidateQueries({ queryKey: ["stylists"] });
      queryClient.invalidateQueries({ queryKey: ["bookings", "stylists"] });
    },
  });
}
