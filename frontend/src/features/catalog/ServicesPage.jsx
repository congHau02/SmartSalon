import React, { useState, useMemo } from "react";
import { Plus, X, CheckCircle2, AlertCircle, Loader2, RefreshCw } from "lucide-react";
import {
  useServices,
  useCreateService,
  useUpdateService,
  useDeleteService,
} from "./useServices";
import { ServiceFormModal } from "./ServiceFormModal";
import { DeleteConfirmModal } from "./DeleteConfirmModal";
import { PRESET_CATEGORIES } from "./constants";
import {
  ServiceStatsCards,
  ServiceFilterBar,
  ServiceTable,
  ServiceEmptyState,
} from "./components/service-list";

export function ServicesPage() {
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeOnly, setActiveOnly] = useState(false);

  // TanStack Query: Fetch catalog
  const {
    data: allServices = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useServices({
    activeOnly: activeOnly ? true : null,
  });

  const createServiceMutation = useCreateService();
  const updateServiceMutation = useUpdateService();
  const deleteServiceMutation = useDeleteService();

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [deletingService, setDeletingService] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = "success") => {
    setToast(message ? { message, type } : null);
    if (message) {
      setTimeout(() => {
        setToast((current) => (current?.message === message ? null : current));
      }, 4000);
    }
  };

  // Unique categories
  const availableCategories = useMemo(() => {
    const set = new Set(PRESET_CATEGORIES);
    if (Array.isArray(allServices)) {
      allServices.forEach((s) => {
        if (s.category) set.add(s.category);
      });
    }
    return Array.from(set);
  }, [allServices]);

  // Client-side search and category filtering
  const filteredServices = useMemo(() => {
    if (!Array.isArray(allServices)) return [];
    let list = allServices;

    if (selectedCategory && selectedCategory !== "ALL") {
      list = list.filter((s) => s.category === selectedCategory);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (s) =>
          s.name?.toLowerCase().includes(q) ||
          s.category?.toLowerCase().includes(q) ||
          s.description?.toLowerCase().includes(q)
      );
    }

    return list;
  }, [allServices, selectedCategory, searchQuery]);

  // Statistics
  const stats = useMemo(() => {
    if (!Array.isArray(allServices)) {
      return { total: 0, active: 0, withBom: 0, avgPrice: 0 };
    }
    const total = allServices.length;
    const active = allServices.filter((s) => s.isActive !== false).length;
    const withBom = allServices.filter((s) => s.bomList && s.bomList.length > 0).length;
    const totalPrice = allServices.reduce((sum, s) => sum + (Number(s.basePrice) || 0), 0);
    const avgPrice = total > 0 ? Math.round(totalPrice / total) : 0;
    return { total, active, withBom, avgPrice };
  }, [allServices]);

  const handleOpenCreateModal = () => {
    setEditingService(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (service) => {
    setEditingService(service);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingService(null);
  };

  const handleFormSubmit = async (payload) => {
    try {
      if (editingService?.id) {
        await updateServiceMutation.mutateAsync({
          id: editingService.id,
          data: payload,
        });
        showToast(`Cập nhật dịch vụ "${payload.name}" thành công!`, "success");
      } else {
        await createServiceMutation.mutateAsync(payload);
        showToast(`Tạo mới dịch vụ "${payload.name}" thành công!`, "success");
      }
      handleCloseModal();
    } catch (err) {
      const msg =
        err?.response?.data?.message || err?.message || "Đã xảy ra lỗi khi lưu dịch vụ";
      showToast(msg, "error");
    }
  };

  const handleConfirmDelete = async (id) => {
    try {
      await deleteServiceMutation.mutateAsync(id);
      showToast("Đã xóa dịch vụ thành công khỏi bảng giá!", "success");
      setDeletingService(null);
    } catch (err) {
      const msg =
        err?.response?.data?.message || err?.message || "Không thể xóa dịch vụ này";
      showToast(msg, "error");
    }
  };

  const handleToggleActive = async (service, e) => {
    e.stopPropagation();
    try {
      const newStatus = !(service.isActive !== false);
      await updateServiceMutation.mutateAsync({
        id: service.id,
        data: {
          name: service.name,
          category: service.category,
          basePrice: service.basePrice,
          durationMinutes: service.durationMinutes,
          description: service.description,
          isActive: newStatus,
          bomList: service.bomList || [],
          defaultSteps: service.defaultSteps || [],
        },
      });
      showToast(
        `Đã ${newStatus ? "kích hoạt" : "tạm ngưng"} dịch vụ "${service.name}"`,
        "success"
      );
    } catch (err) {
      showToast(err?.message || "Không thể thay đổi trạng thái dịch vụ", "error");
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Toast Notification */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl text-xs font-semibold tracking-wide transition-all animate-in slide-in-from-top-4 duration-200 ${
            toast.type === "success"
              ? "bg-emerald-600 text-white shadow-emerald-600/25"
              : "bg-rose-600 text-white shadow-rose-600/25"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
          )}
          <span>{toast.message}</span>
          <button
            type="button"
            onClick={() => setToast(null)}
            aria-label="Đóng thông báo"
            className="ml-2 w-10 h-10 min-w-[40px] min-h-[40px] rounded-lg flex items-center justify-center hover:bg-white/20 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      )}

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              Danh mục Dịch vụ & Định mức BOM
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-pink-50 text-pink-700 border border-pink-200/60">
              {stats.total} dịch vụ
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Quản lý bảng giá chuẩn, công thức trừ kho hoá chất tự động (BOM) và cơ chế chia hoa hồng thợ
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => refetch()}
            aria-label="Tải lại dữ liệu"
            className="w-10 h-10 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 flex items-center justify-center transition-colors cursor-pointer shadow-xs min-h-[44px] min-w-[44px]"
            title="Tải lại danh sách"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          </button>

          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="h-10 px-4 rounded-xl bg-gradient-to-r from-pink-600 to-rose-500 hover:from-pink-700 hover:to-rose-600 text-white font-semibold text-xs shadow-md shadow-pink-500/20 active:scale-[0.99] transition-all flex items-center gap-2 cursor-pointer min-h-[44px]"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm dịch vụ mới</span>
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <ServiceStatsCards stats={stats} />

      {/* Main Content Card: Tabs, Search & Table */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
        <ServiceFilterBar
          allServices={allServices}
          availableCategories={availableCategories}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          activeOnly={activeOnly}
          setActiveOnly={setActiveOnly}
        />

        {/* Content Body: Table or Loading / Empty state */}
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-pink-600" />
            <p className="text-xs font-medium">Đang tải danh mục dịch vụ...</p>
          </div>
        ) : isError ? (
          <div className="p-8 text-center">
            <AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-slate-800">Không thể tải dữ liệu dịch vụ</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
              {error?.message || "Vui lòng kiểm tra lại kết nối mạng hoặc thử lại sau"}
            </p>
            <button
              type="button"
              onClick={() => refetch()}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer min-h-[44px]"
            >
              Thử lại
            </button>
          </div>
        ) : filteredServices.length === 0 ? (
          <ServiceEmptyState
            searchQuery={searchQuery}
            onClearSearch={() => setSearchQuery("")}
            onOpenCreateModal={handleOpenCreateModal}
          />
        ) : (
          <ServiceTable
            filteredServices={filteredServices}
            handleToggleActive={handleToggleActive}
            handleOpenEditModal={handleOpenEditModal}
            setDeletingService={setDeletingService}
          />
        )}
      </div>

      {/* Service Form Modal (Create / Edit) */}
      <ServiceFormModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        initialData={editingService}
        onSubmit={handleFormSubmit}
        isSubmitting={
          createServiceMutation.isPending || updateServiceMutation.isPending
        }
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={Boolean(deletingService)}
        onClose={() => setDeletingService(null)}
        service={deletingService}
        onConfirm={handleConfirmDelete}
        isDeleting={deleteServiceMutation.isPending}
      />
    </div>
  );
}
