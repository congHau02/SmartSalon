import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { voucherApi } from "../../api/voucherApi";

export const VOUCHER_QUERY_KEY = ["admin", "vouchers"];

export function useVouchers() {
  return useQuery({
    queryKey: VOUCHER_QUERY_KEY,
    queryFn: voucherApi.getVouchers,
    staleTime: 30000,
  });
}

export function useCreateVoucher({ onSuccess, onError } = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => voucherApi.createVoucher(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: VOUCHER_QUERY_KEY });
      if (onSuccess) onSuccess(data);
    },
    onError: (err) => {
      if (onError) onError(err);
    },
  });
}

export function useUpdateVoucher({ onSuccess, onError } = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => voucherApi.updateVoucher(id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: VOUCHER_QUERY_KEY });
      if (onSuccess) onSuccess(data);
    },
    onError: (err) => {
      if (onError) onError(err);
    },
  });
}

export function useToggleVoucherActive({ onSuccess, onError } = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, active }) => voucherApi.toggleVoucherActive(id, active),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: VOUCHER_QUERY_KEY });
      if (onSuccess) onSuccess(data);
    },
    onError: (err) => {
      if (onError) onError(err);
    },
  });
}
