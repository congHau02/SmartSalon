import React, { useState, useMemo } from "react";
import {
  Package,
  Plus,
  Search,
  X,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
  Barcode,
  Layers,
} from "lucide-react";
import {
  useProducts,
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,
} from "./useInventory";
import { ProductFormModal } from "./ProductFormModal";
import { DeleteProductModal } from "./DeleteProductModal";
import { PACKAGING_UNITS } from "./constants";
import { formatCurrency } from "../../lib/utils";

export function ProductsPage() {
  // Query Filters State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUnit, setSelectedUnit] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL"); // ALL, ACTIVE, INACTIVE

  // TanStack Query: Fetch all master products
  const {
    data: allProducts = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useProducts();

  const createProductMutation = useCreateProduct();
  const updateProductMutation = useUpdateProduct();
  const deleteProductMutation = useDeleteProduct();

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [deletingProduct, setDeletingProduct] = useState(null);

  // Toast feedback state
  const [toast, setToast] = useState(null);

  const showToast = (message, type = "success") => {
    setToast(message ? { message, type } : null);
    if (message) {
      setTimeout(() => {
        setToast((current) => (current?.message === message ? null : current));
      }, 4000);
    }
  };

  // Client-side filtering
  const filteredProducts = useMemo(() => {
    if (!Array.isArray(allProducts)) return [];
    let list = allProducts;

    // Unit filter
    if (selectedUnit && selectedUnit !== "ALL") {
      list = list.filter((p) => p.unit === selectedUnit);
    }

    // Status filter
    if (statusFilter === "ACTIVE") {
      list = list.filter((p) => p.isActive !== false);
    } else if (statusFilter === "INACTIVE") {
      list = list.filter((p) => p.isActive === false);
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (p) =>
          (p.name && p.name.toLowerCase().includes(q)) ||
          (p.sku && p.sku.toLowerCase().includes(q)) ||
          (p.barcode && p.barcode.toLowerCase().includes(q))
      );
    }

    return list;
  }, [allProducts, selectedUnit, statusFilter, searchQuery]);

  // Statistics
  const stats = useMemo(() => {
    const total = allProducts.length;
    const active = allProducts.filter((p) => p.isActive !== false).length;
    const inactive = total - active;
    return { total, active, inactive };
  }, [allProducts]);

  // Handlers
  const handleOpenCreateModal = () => {
    setEditingProduct(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (product) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
  };

  const handleSubmitProduct = async (formData) => {
    try {
      if (editingProduct?.id) {
        await updateProductMutation.mutateAsync({
          id: editingProduct.id,
          data: formData,
        });
        showToast("Cập nhật thông tin mặt hàng thành công!");
      } else {
        await createProductMutation.mutateAsync(formData);
        showToast("Tạo mặt hàng master mới thành công!");
      }
      handleCloseModal();
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Có lỗi xảy ra khi lưu mặt hàng. Vui lòng thử lại.";
      showToast(msg, "error");
    }
  };

  const handleToggleStatus = async (product) => {
    try {
      await updateProductMutation.mutateAsync({
        id: product.id,
        data: {
          ...product,
          isActive: !product.isActive,
        },
      });
      showToast(
        `Đã ${!product.isActive ? "kích hoạt" : "ngừng kinh doanh"} sản phẩm ${product.name}`
      );
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || "Không thể thay đổi trạng thái sản phẩm.";
      showToast(msg, "error");
    }
  };

  const handleConfirmDelete = async (productId) => {
    try {
      await deleteProductMutation.mutateAsync(productId);
      showToast("Đã xóa mặt hàng khỏi danh mục master!");
      setDeletingProduct(null);
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Không thể xóa sản phẩm. Có thể sản phẩm đang có tồn kho hoặc liên kết BOM.";
      showToast(msg, "error");
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Toast Alert Notification */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl border animate-in slide-in-from-top duration-300 ${
            toast.type === "error"
              ? "bg-rose-50 border-rose-200 text-rose-800"
              : "bg-emerald-50 border-emerald-200 text-emerald-800"
          }`}
        >
          {toast.type === "error" ? (
            <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" aria-hidden="true" />
          ) : (
            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" aria-hidden="true" />
          )}
          <span className="text-sm font-medium">{toast.message}</span>
          <button
            type="button"
            onClick={() => setToast(null)}
            className="p-1 hover:bg-black/5 rounded-lg ml-2 cursor-pointer"
            aria-label="Đóng thông báo"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      )}

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 rounded-xl bg-amber-50 text-amber-600 border border-amber-200">
              <Package className="w-5 h-5" aria-hidden="true" />
            </span>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Danh mục Mặt hàng Master
            </h1>
          </div>
          <p className="text-sm text-slate-500">
            Quản lý mã định danh SKU, mã vạch, quy cách đóng gói và định lượng chuẩn hóa toàn hệ thống.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => refetch()}
            className="min-h-[44px] min-w-[44px] p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer flex items-center justify-center focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-amber-500"
            title="Làm mới danh sách"
            aria-label="Làm mới danh mục"
          >
            <RefreshCw className="w-4 h-4" aria-hidden="true" />
          </button>

          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="min-h-[44px] px-5 py-2.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white rounded-xl font-bold text-sm shadow-md shadow-amber-600/20 transition-all flex items-center gap-2 cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-amber-500"
          >
            <Plus className="w-4 h-4" aria-hidden="true" />
            <span>Thêm mặt hàng mới</span>
          </button>
        </div>
      </div>

      {/* Metric Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Tổng số mặt hàng
            </span>
            <div className="text-2xl font-black text-slate-900">{stats.total}</div>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Layers className="w-5 h-5" aria-hidden="true" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Đang kinh doanh
            </span>
            <div className="text-2xl font-black text-emerald-600">{stats.active}</div>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" aria-hidden="true" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Ngừng kinh doanh
            </span>
            <div className="text-2xl font-black text-slate-400">{stats.inactive}</div>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center">
            <AlertCircle className="w-5 h-5" aria-hidden="true" />
          </div>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Live Search */}
          <div className="relative flex-1">
            <Search
              className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2"
              aria-hidden="true"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo tên mặt hàng, mã SKU hoặc Barcode..."
              className="w-full min-h-[44px] pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="min-h-[44px] min-w-[44px] absolute right-0 top-0 flex items-center justify-center text-slate-400 hover:text-slate-600 cursor-pointer"
                aria-label="Xóa nội dung tìm kiếm"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            )}
          </div>

          {/* Unit Filter */}
          <div className="w-full md:w-56">
            <select
              value={selectedUnit}
              onChange={(e) => setSelectedUnit(e.target.value)}
              aria-label="Lọc theo quy cách đóng gói"
              className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-sm font-medium focus:outline-hidden focus:ring-2 focus:ring-amber-500 cursor-pointer"
            >
              <option value="ALL">Tất cả quy cách ({stats.total})</option>
              {PACKAGING_UNITS.map((unit) => (
                <option key={unit} value={unit}>
                  Đóng gói: {unit}
                </option>
              ))}
            </select>
          </div>

          {/* Status Tabs */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setStatusFilter("ALL")}
              className={`min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                statusFilter === "ALL"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Tất cả
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("ACTIVE")}
              className={`min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                statusFilter === "ACTIVE"
                  ? "bg-white text-emerald-700 shadow-xs"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Kinh doanh
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("INACTIVE")}
              className={`min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                statusFilter === "INACTIVE"
                  ? "bg-white text-slate-700 shadow-xs"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Ngừng
            </button>
          </div>
        </div>
      </div>

      {/* Products Table or State Container */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-16 text-center space-y-3">
            <Loader2 className="w-8 h-8 text-amber-500 animate-spin mx-auto" aria-hidden="true" />
            <p className="text-sm font-semibold text-slate-600">Đang tải danh mục mặt hàng master...</p>
          </div>
        ) : isError ? (
          <div className="p-12 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" aria-hidden="true" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Không thể tải dữ liệu danh mục</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                {error?.message || "Đã xảy ra lỗi kết nối với máy chủ khi tải danh mục sản phẩm."}
              </p>
            </div>
            <button
              type="button"
              onClick={() => refetch()}
              className="min-h-[44px] px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold cursor-pointer"
            >
              Thử lại ngay
            </button>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="p-16 text-center space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-amber-50 text-amber-500 flex items-center justify-center mx-auto border border-amber-100">
              <Package className="w-8 h-8" aria-hidden="true" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-800">Không tìm thấy mặt hàng nào</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                {searchQuery || selectedUnit !== "ALL" || statusFilter !== "ALL"
                  ? "Không có mặt hàng nào phù hợp với các bộ lọc tìm kiếm hiện tại."
                  : "Chưa có sản phẩm nào trong danh mục master. Hãy bấm thêm mặt hàng mới để bắt đầu cấu hình."}
              </p>
            </div>
            {searchQuery || selectedUnit !== "ALL" || statusFilter !== "ALL" ? (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedUnit("ALL");
                  setStatusFilter("ALL");
                }}
                className="min-h-[44px] px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold cursor-pointer"
              >
                Xóa tất cả bộ lọc
              </button>
            ) : (
              <button
                type="button"
                onClick={handleOpenCreateModal}
                className="min-h-[44px] px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-md shadow-amber-600/20 cursor-pointer"
              >
                + Thêm mặt hàng đầu tiên
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th scope="col" className="py-3.5 px-4 sm:px-6">
                    Sản phẩm / Vật tư
                  </th>
                  <th scope="col" className="py-3.5 px-4">
                    Mã SKU & Barcode
                  </th>
                  <th scope="col" className="py-3.5 px-4">
                    Quy cách & Thể tích chuẩn
                  </th>
                  <th scope="col" className="py-3.5 px-4">
                    Giá vốn / Giá bán
                  </th>
                  <th scope="col" className="py-3.5 px-4">
                    Ngưỡng báo thiếu
                  </th>
                  <th scope="col" className="py-3.5 px-4 text-center">
                    Trạng thái
                  </th>
                  <th scope="col" className="py-3.5 px-4 sm:px-6 text-right">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredProducts.map((product) => {
                  const isActive = product.isActive !== false;
                  return (
                    <tr
                      key={product.id}
                      className="hover:bg-slate-50/80 transition-colors group"
                    >
                      {/* Name & ID */}
                      <td className="py-4 px-4 sm:px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-100 font-bold">
                            <Package className="w-5 h-5" aria-hidden="true" />
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 group-hover:text-amber-600 transition-colors">
                              {product.name}
                            </div>
                            <div className="text-[11px] text-slate-400 mt-0.5">
                              ID: #{product.id}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* SKU & Barcode */}
                      <td className="py-4 px-4">
                        <div className="space-y-1">
                          <span className="inline-block px-2 py-0.5 rounded-md font-mono text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                            {product.sku}
                          </span>
                          {product.barcode && (
                            <div className="flex items-center gap-1 text-[11px] font-mono text-slate-500">
                              <Barcode className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
                              <span>{product.barcode}</span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Packaging Unit & Volume */}
                      <td className="py-4 px-4">
                        <div className="space-y-0.5">
                          <span className="font-semibold text-slate-800">
                            1 {product.unit}
                          </span>
                          <div className="text-[11px] text-amber-700 font-medium">
                            {product.volumeOrWeightPerUnit} {product.volumeUnit}
                          </div>
                        </div>
                      </td>

                      {/* Cost & Retail Price */}
                      <td className="py-4 px-4">
                        <div className="space-y-0.5">
                          <div className="font-bold text-slate-900">
                            {formatCurrency(product.retailPrice)}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            Vốn: {formatCurrency(product.costPrice)}
                          </div>
                        </div>
                      </td>

                      {/* Min Stock Alert */}
                      <td className="py-4 px-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                          &le; {product.minStockAlertUnits ?? 5} {product.unit}
                        </span>
                      </td>

                      {/* Active Status Switch */}
                      <td className="py-4 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(product)}
                          className={`min-h-[44px] min-w-[44px] inline-flex items-center justify-center cursor-pointer`}
                          title={isActive ? "Nhấn để ngừng kinh doanh" : "Nhấn để kích hoạt"}
                          aria-label={`Trạng thái: ${isActive ? "Đang kinh doanh" : "Ngừng kinh doanh"}`}
                        >
                          <span
                            className={`px-2.5 py-1 rounded-full text-[11px] font-bold border transition-colors ${
                              isActive
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                                : "bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200"
                            }`}
                          >
                            {isActive ? "Kinh doanh" : "Ngừng"}
                          </span>
                        </button>
                      </td>

                      {/* Action buttons */}
                      <td className="py-4 px-4 sm:px-6 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(product)}
                            className="min-h-[44px] min-w-[44px] p-2 rounded-xl text-slate-500 hover:text-amber-600 hover:bg-amber-50 transition-colors cursor-pointer flex items-center justify-center focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-amber-500"
                            aria-label={`Chỉnh sửa mặt hàng ${product.name}`}
                          >
                            <Edit2 className="w-4 h-4" aria-hidden="true" />
                          </button>

                          <button
                            type="button"
                            onClick={() => setDeletingProduct(product)}
                            className="min-h-[44px] min-w-[44px] p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer flex items-center justify-center focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-rose-500"
                            aria-label={`Xóa mặt hàng ${product.name}`}
                          >
                            <Trash2 className="w-4 h-4" aria-hidden="true" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer info bar */}
        {!isLoading && !isError && filteredProducts.length > 0 && (
          <div className="p-4 bg-slate-50/60 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>
              Hiển thị <strong>{filteredProducts.length}</strong> trên tổng số{" "}
              <strong>{allProducts.length}</strong> mặt hàng
            </span>
            <span className="text-slate-400">
              Quy chuẩn đóng gói & định lượng áp dụng toàn chuỗi
            </span>
          </div>
        )}
      </div>

      {/* Modal: Create / Edit Product */}
      <ProductFormModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleSubmitProduct}
        initialData={editingProduct}
        isSubmitting={
          createProductMutation.isPending || updateProductMutation.isPending
        }
      />

      {/* Modal: Delete Product Confirmation */}
      <DeleteProductModal
        isOpen={Boolean(deletingProduct)}
        onClose={() => setDeletingProduct(null)}
        product={deletingProduct}
        onConfirm={handleConfirmDelete}
        isDeleting={deleteProductMutation.isPending}
      />
    </div>
  );
}
