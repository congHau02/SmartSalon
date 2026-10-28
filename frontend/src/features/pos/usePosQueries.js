import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { posApi } from "../../api/posApi";
import { QUERY_KEYS, invalidateRealtimeCaches } from "../../lib/queryKeys";

/**
 * Hook for fetching Dispatch Board data with polling.
 */
export function useDispatchBoard(branchId, date, options = {}) {
  return useQuery({
    queryKey: QUERY_KEYS.posBoard(branchId, date),
    queryFn: () => posApi.getDispatchBoard(branchId, date),
    enabled: Boolean(branchId),
    refetchInterval: 15000,
    ...options,
  });
}

/**
 * Hook for booking check-in mutation.
 */
export function useCheckInBooking({ branchId, date, onSuccess, onError, onSettled } = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (bookingId) => posApi.checkInBooking(bookingId),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.posBoard(branchId, date),
      });
      if (onSuccess) onSuccess(data, variables, context);
    },
    onError: (err, variables, context) => {
      if (onError) onError(err, variables, context);
    },
    onSettled: (data, error, variables, context) => {
      if (onSettled) onSettled(data, error, variables, context);
    },
  });
}

/**
 * Hook for walk-in order creation mutation.
 */
export function useCreateWalkInOrder({ onSuccess, onError } = {}) {
  return useMutation({
    mutationFn: (payload) => posApi.createWalkInOrder(payload),
    onSuccess: (data, variables, context) => {
      if (onSuccess) onSuccess(data, variables, context);
    },
    onError: (err, variables, context) => {
      if (onError) onError(err, variables, context);
    },
  });
}

/**
 * Hook for fetching daily commission ledger.
 */
export function useCommissionLedgerDaily(branchId, date, options = {}) {
  return useQuery({
    queryKey: QUERY_KEYS.commissionLedgerDaily(branchId, date),
    queryFn: () => posApi.getDailyCommissionLedger(branchId, date),
    enabled: Boolean(branchId),
    ...options,
  });
}

/**
 * Hook for fetching dynamic VietQR payment data.
 */
export function usePosVietQr(orderId, debouncedDiscount, options = {}) {
  return useQuery({
    queryKey: QUERY_KEYS.posVietQr(orderId, debouncedDiscount),
    queryFn: () => posApi.getPosVietQr(orderId, debouncedDiscount),
    ...options,
  });
}

/**
 * Hook for fetching an order's Visual Log.
 */
export function useVisualLog(orderId, options = {}) {
  return useQuery({
    queryKey: QUERY_KEYS.visualLog(orderId),
    queryFn: () => posApi.getVisualLog(orderId),
    enabled: Boolean(orderId),
    ...options,
  });
}

/**
 * Hook for saving Visual Log details and BOM overrides.
 */
export function useSaveVisualLog(orderId, { onSuccess, onError } = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload) => posApi.saveVisualLog(orderId, payload),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.visualLog(orderId) });
      if (onSuccess) onSuccess(data, variables, context);
    },
    onError: (err, variables, context) => {
      if (onError) onError(err, variables, context);
    },
  });
}

/**
 * Hook for uploading before/after camera images.
 */
export function useUploadMedia(options = {}) {
  return useMutation({
    mutationFn: (formData) => posApi.uploadMedia(formData),
    ...options,
  });
}

/**
 * Hook for POS checkout mutation.
 */
export function useCheckoutOrder(orderId, { onSuccess, onError } = {}) {
  return useMutation({
    mutationFn: (payload) => posApi.checkoutOrder(orderId, payload),
    onSuccess: (data, variables, context) => {
      if (onSuccess) onSuccess(data, variables, context);
    },
    onError: (err, variables, context) => {
      if (onError) onError(err, variables, context);
    },
  });
}

/**
 * Hook for fetching today's staff shift and live attendance list.
 */
export function useTodayAttendance(branchId, options = {}) {
  return useQuery({
    queryKey: QUERY_KEYS.posTodayAttendance(branchId),
    queryFn: () => posApi.getTodayAttendance(branchId),
    enabled: Boolean(branchId),
    staleTime: 15000,
    ...options,
  });
}

/**
 * Hook for submitting a 1-touch PIN attendance action.
 */
export function useAttendanceAction({ branchId, onSuccess, onError } = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload) => posApi.submitAttendanceAction(payload),
    onSuccess: (data, variables, context) => {
      invalidateRealtimeCaches(queryClient);
      if (branchId) {
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.posTodayAttendance(branchId),
        });
      }
      if (onSuccess) onSuccess(data, variables, context);
    },
    onError: (err, variables, context) => {
      if (onError) onError(err, variables, context);
    },
  });
}
