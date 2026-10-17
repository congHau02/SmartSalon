import React, { useState, useMemo } from "react";
import {
  Scissors,
  Plus,
  Search,
  X,
  FlaskConical,
  Layers,
  Clock,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  FolderKanban,
  Loader2,
  RefreshCw,
} from "lucide-react";
import {
  useServices,
  useCreateService,
  useUpdateService,
  useDeleteService,
} from "./useServices";
import { ServiceFormModal } from "./ServiceFormModal";
import { DeleteConfirmModal } from "./DeleteConfirmModal";
import { PRESET_CATEGORIES } from "./constants";
import { formatCurrency } from "../../lib/utils";

// Category badge color helper
function getCategoryBadgeClass(category) {
  switch (category) {
    case "Cắt tóc & Tạo kiểu":
      return "bg-amber-50 text-amber-800 border-amber-200/80";
    case "Uốn - Nhuộm":
      return "bg-purple-50 text-purple-800 border-purple-200/80";
    case "Gội dưỡng sinh & Spa":
      return "bg-emerald-50 text-emerald-800 border-emerald-200/80";
    case "Phục hồi":
      return "bg-rose-50 text-rose-800 border-rose-200/80";
    default:
      return "bg-slate-100 text-slate-700 border-slate-200";
  }
}

export function ServicesPage() {
  // Query Filters State
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeOnly, setActiveOnly] = useState(false);

  // TanStack Query: Fetch catalog (optionally filtered by active state)
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

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [deletingService, setDeletingService] = useState(null);

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

  // Derive dynamic list of all unique categories present across catalog + presets
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

  // Catalog statistics computed over full catalog
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

  // Action handlers
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

  // Quick toggle active status inline
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
            className="w-10 h-10 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 flex items-center justify-center transition-colors cursor-pointer shadow-xs"
            title="Tải lại danh sách"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          </button>

          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="h-10 px-4 rounded-xl bg-gradient-to-r from-pink-600 to-rose-500 hover:from-pink-700 hover:to-rose-600 text-white font-semibold text-xs shadow-md shadow-pink-500/20 active:scale-[0.99] transition-all flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm dịch vụ mới</span>
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-pink-50 text-pink-600 flex items-center justify-center shrink-0">
            <Scissors className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Tổng dịch vụ
            </p>
            <p className="text-lg font-bold text-slate-900">{stats.total}</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Đang kinh doanh
            </p>
            <p className="text-lg font-bold text-slate-900">{stats.active}</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <FlaskConical className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Đã cấu hình BOM
            </p>
            <p className="text-lg font-bold text-slate-900">{stats.withBom}</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <FolderKanban className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Giá trung bình
            </p>
            <p className="text-lg font-bold text-slate-900">{formatCurrency(stats.avgPrice)}</p>
          </div>
        </div>
      </div>

      {/* Main Content Card: Tabs, Search & Table */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
        {/* Category Pills Navigation */}
        <div className="p-4 sm:p-5 border-b border-slate-100 space-y-3.5">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            <button
              type="button"
              onClick={() => setSelectedCategory("ALL")}
              className={`px-3.5 py-2 min-h-[40px] rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 ${
                selectedCategory === "ALL"
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
              }`}
            >
              Tất cả ({allServices.length})
            </button>

            {availableCategories.map((cat) => {
              const count = allServices.filter((s) => s.category === cat).length;
              const isSelected = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-2 min-h-[40px] rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 ${
                    isSelected
                      ? "bg-pink-600 text-white shadow-xs shadow-pink-500/20"
                      : "bg-slate-100 text-slate-600 hover:bg-pink-50 hover:text-pink-700"
                  }`}
                >
                  <span>{cat}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                      isSelected
                        ? "bg-white/20 text-white"
                        : "bg-slate-200 text-slate-600"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search Box & Quick Status Filter */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm kiếm nhanh theo tên dịch vụ, mô tả..."
                className="w-full h-10 pl-9.5 pr-10 rounded-xl border border-slate-200 bg-slate-50/50 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  aria-label="Xóa ô tìm kiếm"
                  className="w-10 h-10 min-w-[40px] min-h-[40px] absolute right-1 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 flex items-center justify-center cursor-pointer rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500"
                >
                  <X className="w-4 h-4" aria-hidden="true" />
                </button>
              )}
            </div>

            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-600 select-none">
              <input
                type="checkbox"
                checked={activeOnly}
                onChange={(e) => setActiveOnly(e.target.checked)}
                className="w-4 h-4 rounded text-pink-600 focus:ring-pink-500 border-slate-300 cursor-pointer"
              />
              <span>Chỉ hiển thị dịch vụ đang mở bán</span>
            </label>
          </div>
        </div>

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
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
            >
              Thử lại
            </button>
          </div>
        ) : filteredServices.length === 0 ? (
          <div className="py-16 px-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <Scissors className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">Không có dịch vụ nào phù hợp</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-5">
              {searchQuery
                ? `Không tìm thấy dịch vụ nào khớp với từ khóa "${searchQuery}"`
                : "Danh mục này hiện chưa có dịch vụ nào. Hãy bắt đầu bằng cách thêm dịch vụ mới."}
            </p>
            {searchQuery ? (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
              >
                Xóa bộ lọc tìm kiếm
              </button>
            ) : (
              <button
                type="button"
                onClick={handleOpenCreateModal}
                className="px-4 py-2 rounded-xl bg-pink-600 hover:bg-pink-700 text-white text-xs font-semibold cursor-pointer shadow-xs"
              >
                + Thêm dịch vụ đầu tiên
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3.5 pl-6 pr-4">Tên dịch vụ</th>
                  <th className="py-3.5 px-4">Nhóm danh mục</th>
                  <th className="py-3.5 px-4">Thời lượng</th>
                  <th className="py-3.5 px-4">Giá niêm yết</th>
                  <th className="py-3.5 px-4">Định mức BOM</th>
                  <th className="py-3.5 px-4">Quy trình & Hoa hồng</th>
                  <th className="py-3.5 px-4 text-center">Trạng thái</th>
                  <th className="py-3.5 pl-4 pr-6 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {filteredServices.map((service) => {
                  const bomCount = service.bomList?.length || 0;
                  const stepCount = service.defaultSteps?.length || 0;
                  const totalRate = (service.defaultSteps || []).reduce(
                    (sum, s) => sum + (parseFloat(s.commissionRate) || 0),
                    0
                  );
                  const isServiceActive = service.isActive !== false;

                  return (
                    <tr
                      key={service.id}
                      className="hover:bg-slate-50/70 transition-colors group"
                    >
                      {/* Name & Description */}
                      <td className="py-4 pl-6 pr-4">
                        <div className="font-bold text-slate-900 group-hover:text-pink-600 transition-colors">
                          {service.name}
                        </div>
                        {service.description && (
                          <p className="text-[11px] text-slate-400 line-clamp-1 max-w-xs mt-0.5">
                            {service.description}
                          </p>
                        )}
                      </td>

                      {/* Category */}
                      <td className="py-4 px-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.8 rounded-lg text-[11px] font-bold border ${getCategoryBadgeClass(
                            service.category
                          )}`}
                        >
                          {service.category}
                        </span>
                      </td>

                      {/* Duration */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-1.5 text-slate-600 font-medium">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>{service.durationMinutes} phút</span>
                        </div>
                      </td>

                      {/* Base Price */}
                      <td className="py-4 px-4">
                        <span className="font-bold text-slate-900 text-sm">
                          {formatCurrency(service.basePrice)}
                        </span>
                      </td>

                      {/* BOM Formula */}
                      <td className="py-4 px-4">
                        {bomCount > 0 ? (
                          <div
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-pink-50/80 text-pink-700 border border-pink-200/60 font-semibold text-[11px]"
                            title={service.bomList
                              ?.map((b) => `${b.productName}: ${b.standardAmount}${b.unit}`)
                              .join(", ")}
                          >
                            <FlaskConical className="w-3.5 h-3.5 text-pink-600" />
                            <span>{bomCount} hoá chất</span>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">
                            Chưa cấu hình
                          </span>
                        )}
                      </td>

                      {/* Steps & Commission */}
                      <td className="py-4 px-4">
                        {stepCount > 0 ? (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-semibold text-[11px]">
                            <Layers className="w-3.5 h-3.5 text-slate-500" />
                            <span>
                              {stepCount} bước ({totalRate}%)
                            </span>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">Chưa tạo bước</span>
                        )}
                      </td>

                      {/* Active Status Switch */}
                      <td className="py-4 px-4 text-center">
                        <button
                          type="button"
                          onClick={(e) => handleToggleActive(service, e)}
                          title={isServiceActive ? "Bấm để tạm ngưng" : "Bấm để mở lại"}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold cursor-pointer transition-all ${
                            isServiceActive
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200/80 hover:bg-emerald-100"
                              : "bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-200"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isServiceActive ? "bg-emerald-500" : "bg-slate-400"
                            }`}
                          />
                          <span>{isServiceActive ? "Kinh doanh" : "Tạm ngưng"}</span>
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-4 pl-4 pr-6 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(service)}
                            aria-label={`Chỉnh sửa ${service.name}`}
                            className="w-10 h-10 min-w-[40px] min-h-[40px] rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500"
                            title="Chỉnh sửa dịch vụ & BOM"
                          >
                            <Edit2 className="w-4 h-4" aria-hidden="true" />
                          </button>

                          <button
                            type="button"
                            onClick={() => setDeletingService(service)}
                            aria-label={`Xóa ${service.name}`}
                            className="w-10 h-10 min-w-[40px] min-h-[40px] rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
                            title="Xóa dịch vụ"
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
