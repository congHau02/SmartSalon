import React, { useState, useMemo } from "react";
import { AlertCircle, Loader2 } from "lucide-react";
import {
  useServices,
  useCreateService,
  useUpdateService,
  useDeleteService,
} from "./useServices";
import { PRESET_CATEGORIES } from "./constants";
import {
  ServiceStatsCards,
  ServiceFilterBar,
  ServiceTable,
  ServiceEmptyState,
} from "./components/service-list";
import { ServicesHeader } from "./components/service-list/ServicesHeader";
import { ServiceToast } from "./components/service-list/ServiceToast";
import { ServicesModals } from "./components/service-list/ServicesModals";

export function ServicesPage() {
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeOnly, setActiveOnly] = useState(false);

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

  const availableCategories = useMemo(() => {
    const set = new Set(PRESET_CATEGORIES);
    if (Array.isArray(allServices)) {
      allServices.forEach((s) => {
        if (s.category) set.add(s.category);
      });
    }
    return Array.from(set);
  }, [allServices]);

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
      <ServiceToast toast={toast} onClose={() => setToast(null)} />

      <ServicesHeader
        totalServices={stats.total}
        isLoading={isLoading}
        onRefresh={() => refetch()}
        onCreate={handleOpenCreateModal}
      />

      <ServiceStatsCards stats={stats} />

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

      <ServicesModals
        modalState={{
          isOpen: isModalOpen,
          onClose: handleCloseModal,
          initialData: editingService,
          onSubmit: handleFormSubmit,
          isSubmitting: createServiceMutation.isPending || updateServiceMutation.isPending,
        }}
        deleteState={{
          service: deletingService,
          onClose: () => setDeletingService(null),
          onConfirm: handleConfirmDelete,
          isDeleting: deleteServiceMutation.isPending,
        }}
      />
    </div>
  );
}
