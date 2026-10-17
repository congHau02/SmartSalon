import { axiosClient } from "../../api/axiosClient";

export const inventoryApi = {
  // Master Products API
  getProducts: async ({ keyword, activeOnly } = {}) => {
    const params = {};
    if (keyword) params.keyword = keyword.trim();
    if (activeOnly !== undefined && activeOnly !== null) params.activeOnly = activeOnly;
    const response = await axiosClient.get("/products", { params });
    return response?.result ?? response ?? [];
  },

  getProductById: async (id) => {
    const response = await axiosClient.get(`/products/${id}`);
    return response?.result ?? response;
  },

  createProduct: async (productData) => {
    const response = await axiosClient.post("/products", productData);
    return response?.result ?? response;
  },

  updateProduct: async (id, productData) => {
    const response = await axiosClient.put(`/products/${id}`, productData);
    return response?.result ?? response;
  },

  deleteProduct: async (id) => {
    const response = await axiosClient.delete(`/products/${id}`);
    return response?.result ?? response;
  },

  // Branch Inventory API
  getBranchInventory: async (branchId, { lowStockOnly } = {}) => {
    const params = {};
    if (lowStockOnly !== undefined && lowStockOnly !== null) params.lowStockOnly = lowStockOnly;
    const response = await axiosClient.get(`/branches/${branchId}/inventory`, { params });
    return response?.result ?? response ?? [];
  },

  getBranchInventoryByProductId: async (branchId, productId) => {
    const response = await axiosClient.get(`/branches/${branchId}/inventory/${productId}`);
    return response?.result ?? response;
  },

  stockIn: async (branchId, data) => {
    const response = await axiosClient.post(`/branches/${branchId}/inventory/stock-in`, data);
    return response?.result ?? response;
  },

  stockAdjustment: async (branchId, data) => {
    const response = await axiosClient.post(`/branches/${branchId}/inventory/adjustment`, data);
    return response?.result ?? response;
  },

  getTransactions: async (branchId, { productId } = {}) => {
    const params = {};
    if (productId) params.productId = productId;
    const response = await axiosClient.get(`/branches/${branchId}/inventory/transactions`, { params });
    return response?.result ?? response ?? [];
  },
};
