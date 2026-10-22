import React, { useState, useMemo } from "react";
import { AlertCircle, Loader2 } from "lucide-react";
import {
  useProducts,
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,
} from "./useInventory";
import { ProductFormModal } from "./ProductFormModal";
import { DeleteProductModal } from "./DeleteProductModal";
import { ProductsHeader } from "./components/products-list/ProductsHeader";
import { ProductsStatsCards } from "./components/products-list/ProductsStatsCards";
import { ProductsFilterBar } from "./components/products-list/ProductsFilterBar";
import { ProductsTable } from "./components/products-list/ProductsTable";
import { ProductsEmptyState } from "./components/products-list/ProductsEmptyState";
import { ProductsToast } from "./components/products-list/ProductsToast";

export function ProductsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUnit, setSelectedUnit] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

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

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [deletingProduct, setDeletingProduct] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = "success") => {
    setToast(message ? { message, type } : null);
    if (message) {
      setTimeout(() => {
        setToast((current) => (current?.message === message ? null : current));
      }, 4000);
    }
  };

  const filteredProducts = useMemo(() => {
    if (!Array.isArray(allProducts)) return [];
    let list = allProducts;

    if (selectedUnit && selectedUnit !== "ALL") {
      list = list.filter((p) => p.unit === selectedUnit);
    }

    if (statusFilter === "ACTIVE") {
      list = list.filter((p) => p.isActive !== false);
    } else if (statusFilter === "INACTIVE") {
      list = list.filter((p) => p.isActive === false);
    }

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

  const stats = useMemo(() => {
    const total = allProducts.length;
    const active = allProducts.filter((p) => p.isActive !== false).length;
    const inactive = total - active;
    return { total, active, inactive };
  }, [allProducts]);

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
      <ProductsToast toast={toast} onClose={() => setToast(null)} />

      <ProductsHeader
        onRefresh={() => refetch()}
        onCreateProduct={handleOpenCreateModal}
      />

      <ProductsStatsCards stats={stats} />

      <ProductsFilterBar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedUnit={selectedUnit}
        setSelectedUnit={setSelectedUnit}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        totalCount={stats.total}
      />

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
          <ProductsEmptyState />
        ) : (
          <ProductsTable
            filteredProducts={filteredProducts}
            allCount={allProducts.length}
            onToggleStatus={handleToggleStatus}
            onEditProduct={handleOpenEditModal}
            onDeleteProduct={(product) => setDeletingProduct(product)}
          />
        )}
      </div>

      <ProductFormModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleSubmitProduct}
        initialData={editingProduct}
        isSubmitting={createProductMutation.isPending || updateProductMutation.isPending}
      />

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
