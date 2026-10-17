import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { catalogApi } from "./catalogApi";

export const SERVICE_QUERY_KEYS = {
  all: ["services"],
  list: (filters) => ["services", "list", filters],
  detail: (id) => ["services", "detail", id],
  categories: ["services", "categories"],
  masterProducts: ["masterProducts"],
};

export function useServices(filters = {}) {
  return useQuery({
    queryKey: SERVICE_QUERY_KEYS.list(filters),
    queryFn: () => catalogApi.getServices(filters),
  });
}

export function useServiceCategories() {
  return useQuery({
    queryKey: SERVICE_QUERY_KEYS.categories,
    queryFn: () => catalogApi.getCategories(),
  });
}

export function useService(id) {
  return useQuery({
    queryKey: SERVICE_QUERY_KEYS.detail(id),
    queryFn: () => catalogApi.getServiceById(id),
    enabled: Boolean(id),
  });
}

export function useMasterProducts(filters = { activeOnly: true }) {
  return useQuery({
    queryKey: SERVICE_QUERY_KEYS.masterProducts,
    queryFn: () => catalogApi.getMasterProducts(filters),
    staleTime: 1000 * 60 * 10, // 10 minutes cache for product catalog
  });
}

export function useCreateService() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (newService) => catalogApi.createService(newService),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SERVICE_QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: SERVICE_QUERY_KEYS.categories });
    },
  });
}

export function useUpdateService() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => catalogApi.updateService(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: SERVICE_QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: SERVICE_QUERY_KEYS.categories });
      queryClient.invalidateQueries({ queryKey: SERVICE_QUERY_KEYS.detail(variables.id) });
    },
  });
}

export function useDeleteService() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => catalogApi.deleteService(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SERVICE_QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: SERVICE_QUERY_KEYS.categories });
    },
  });
}
