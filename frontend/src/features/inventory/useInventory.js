import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { inventoryApi } from "./inventoryApi";

export const INVENTORY_QUERY_KEYS = {
  products: ["products"],
  productList: (filters) => ["products", "list", filters],
  productDetail: (id) => ["products", "detail", id],
  branchInventory: (branchId, filters) => ["branchInventory", branchId, filters],
  transactions: (branchId, filters) => ["inventoryTransactions", branchId, filters],
};

// ==================== Products Hooks ====================

export function useProducts(filters = {}) {
  return useQuery({
    queryKey: INVENTORY_QUERY_KEYS.productList(filters),
    queryFn: () => inventoryApi.getProducts(filters),
  });
}

export function useProduct(id) {
  return useQuery({
    queryKey: INVENTORY_QUERY_KEYS.productDetail(id),
    queryFn: () => inventoryApi.getProductById(id),
    enabled: Boolean(id),
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (newProduct) => inventoryApi.createProduct(newProduct),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: INVENTORY_QUERY_KEYS.products });
      queryClient.invalidateQueries({ queryKey: ["masterProducts"] });
      queryClient.invalidateQueries({ queryKey: ["branchInventory"] });
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => inventoryApi.updateProduct(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: INVENTORY_QUERY_KEYS.products });
      queryClient.invalidateQueries({ queryKey: INVENTORY_QUERY_KEYS.productDetail(variables.id) });
      queryClient.invalidateQueries({ queryKey: ["masterProducts"] });
      queryClient.invalidateQueries({ queryKey: ["branchInventory"] });
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => inventoryApi.deleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: INVENTORY_QUERY_KEYS.products });
      queryClient.invalidateQueries({ queryKey: ["masterProducts"] });
      queryClient.invalidateQueries({ queryKey: ["branchInventory"] });
    },
  });
}

// ==================== Branch Inventory Hooks ====================

export function useBranchInventory(branchId, filters = {}) {
  return useQuery({
    queryKey: INVENTORY_QUERY_KEYS.branchInventory(branchId, filters),
    queryFn: () => inventoryApi.getBranchInventory(branchId, filters),
    enabled: Boolean(branchId),
  });
}

export function useStockIn(branchId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => inventoryApi.stockIn(branchId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["branchInventory", branchId] });
      queryClient.invalidateQueries({ queryKey: ["inventoryTransactions", branchId] });
    },
  });
}

export function useDirectStockIn({ onSuccess, onError } = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ branchId, data }) => inventoryApi.stockIn(branchId, data),
    onSuccess: (result, variables, context) => {
      queryClient.invalidateQueries({ queryKey: ["analytics-inventory-alerts"] });
      queryClient.invalidateQueries({ queryKey: ["branchInventory"] });
      queryClient.invalidateQueries({ queryKey: ["inventoryTransactions", variables.branchId] });
      if (onSuccess) onSuccess(result, variables, context);
    },
    onError: (err, variables, context) => {
      if (onError) onError(err, variables, context);
    },
  });
}

export function useStockAdjustment(branchId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => inventoryApi.stockAdjustment(branchId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["branchInventory", branchId] });
      queryClient.invalidateQueries({ queryKey: ["inventoryTransactions", branchId] });
    },
  });
}

export function useInventoryTransactions(branchId, filters = {}) {
  return useQuery({
    queryKey: INVENTORY_QUERY_KEYS.transactions(branchId, filters),
    queryFn: () => inventoryApi.getTransactions(branchId, filters),
    enabled: Boolean(branchId),
  });
}
