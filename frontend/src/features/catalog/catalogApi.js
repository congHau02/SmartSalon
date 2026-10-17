import { axiosClient } from "../../api/axiosClient";

export const catalogApi = {
  // Lấy danh sách dịch vụ
  getServices: async ({ category, activeOnly } = {}) => {
    const params = {};
    if (category && category !== "ALL") {
      params.category = category;
    }
    if (activeOnly !== undefined && activeOnly !== null) {
      params.activeOnly = activeOnly;
    }
    const response = await axiosClient.get("/services", { params });
    return response?.result ?? response ?? [];
  },

  // Lấy danh mục dịch vụ duy nhất
  getCategories: async () => {
    const response = await axiosClient.get("/services/categories");
    return response?.result ?? response ?? [];
  },

  // Lấy chi tiết dịch vụ theo ID
  getServiceById: async (id) => {
    const response = await axiosClient.get(`/services/${id}`);
    return response?.result ?? response;
  },

  // Tạo mới dịch vụ
  createService: async (serviceData) => {
    const response = await axiosClient.post("/services", serviceData);
    return response?.result ?? response;
  },

  // Cập nhật dịch vụ
  updateService: async (id, serviceData) => {
    const response = await axiosClient.put(`/services/${id}`, serviceData);
    return response?.result ?? response;
  },

  // Xóa mềm dịch vụ
  deleteService: async (id) => {
    const response = await axiosClient.delete(`/services/${id}`);
    return response?.result ?? response;
  },

  // Lấy danh sách sản phẩm master để chọn định mức BOM
  getMasterProducts: async ({ keyword, activeOnly = true } = {}) => {
    const params = { activeOnly };
    if (keyword) {
      params.keyword = keyword;
    }
    const response = await axiosClient.get("/products", { params });
    return response?.result ?? response ?? [];
  },
};
