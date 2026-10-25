import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { posApi } from "../../api/posApi";
import { QUERY_KEYS, invalidateRealtimeCaches } from "../../lib/queryKeys";

/**
 * Hook for fetching Stylist Daily Worklog metrics and shift handover summary.
 */
export function useStylistDailyWorklog({ branchId, stylistId, date, enabled = true } = {}) {
  return useQuery({
    queryKey: QUERY_KEYS.stylistDailyWorklog(branchId, stylistId, date),
    queryFn: () => posApi.getStylistDailyWorklog({ branchId, stylistId, date }),
    enabled: Boolean(enabled),
    refetchInterval: 15000,
  });
}

/**
 * Hook for submitting a 1-step Quick Service Ticket.
 */
export function useCreateQuickServiceTicket({ onSuccess, onError } = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload) => posApi.createQuickServiceTicket(payload),
    onSuccess: (data, variables, context) => {
      invalidateRealtimeCaches(queryClient);
      if (onSuccess) onSuccess(data, variables, context);
    },
    onError: (err, variables, context) => {
      if (onError) onError(err, variables, context);
    },
  });
}

/**
 * Hook for 1-click Quick Complete of a scheduled booking.
 */
export function useQuickCompleteBooking({ onSuccess, onError } = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ bookingId, data }) => posApi.quickCompleteBooking(bookingId, data),
    onSuccess: (data, variables, context) => {
      invalidateRealtimeCaches(queryClient);
      if (onSuccess) onSuccess(data, variables, context);
    },
    onError: (err, variables, context) => {
      if (onError) onError(err, variables, context);
    },
  });
}
