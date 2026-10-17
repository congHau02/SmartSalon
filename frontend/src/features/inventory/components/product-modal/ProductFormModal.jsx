import React, { useEffect, useId } from "react";
import {
  X,
  Package,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { PACKAGING_UNITS, VOLUME_UNITS } from "../../constants";
import { formatCurrency } from "../../../../lib/utils";
import { useProductForm } from "./useProductForm";

function ProductFormInner({
  initialData,
  onClose,
  onSubmit,
  isSubmitting,
  titleId,
}) {
  const {
    isEditMode,
    register,
    errors,
    watchedCostPrice,
    watchedRetailPrice,
    onFormSubmit,
  } = useProductForm({ initialData, onSubmit });

  const hasErrors = Object.keys(errors).length > 0;

  return (
    <>
      {/* Modal Header */}
      <div className="flex items-center justify-between px-6 py-4.5 border-b border-slate-100 bg-slate-50/60">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-pink-100 text-pink-700 flex items-center justify-center shrink-0">
            <Package className="w-5 h-5" aria-hidden="true" />
          </div>
          <div>
            <h2 id={titleId} className="text-lg font-bold text-slate-900 leading-tight">
              {isEditMode ? "Chỉnh sửa Sản phẩm Master" : "Tạo Sản phẩm / Vật tư Mới"}
            </h2>
            <p className="text-xs text-slate-500">
              Quy cách đóng gói, định mức thể tích và đơn giá dùng chung toàn hệ thống
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          disabled={isSubmitting}
          aria-label="Đóng cửa sổ"
          className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500"
        >
          <X className="w-5 h-5" aria-hidden="true" />
        </button>
      </div>

      {/* Global Form Errors */}
      {hasErrors && (
        <div
          role="alert"
          className="mx-6 mt-4 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2.5 animate-in fade-in"
        >
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" aria-hidden="true" />
          <div className="flex-1 font-medium">
            Có thông tin chưa hợp lệ. Vui lòng kiểm tra lại các trường được đánh dấu đỏ bên dưới.
          </div>
        </div>
      )}

      {/* Form Body */}
      <form id="product-form" onSubmit={onFormSubmit} className="flex-1 overflow-y-auto p-6 space-y-4.5">
        {/* Name */}
        <div>
          <label
            htmlFor="product-name"
            className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
          >
            Tên sản phẩm / vật tư <span className="text-pink-600">*</span>
          </label>
          <input
            id="product-name"
            type="text"
            {...register("name")}
            placeholder="Ví dụ: Kem nhuộm tóc L'Oreal Inoa 60g, Dầu gội Olaplex No.4..."
            className={`w-full h-11 px-3.5 rounded-xl border text-sm text-slate-900 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 transition-all ${
              errors.name
                ? "border-rose-400 focus:ring-rose-400/30"
                : "border-slate-200 focus:border-pink-500 focus:ring-pink-500/20"
            }`}
          />
          {errors.name && (
            <p className="mt-1 text-xs text-rose-600 font-medium">{errors.name.message}</p>
          )}
        </div>

        {/* SKU and Barcode Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="product-sku"
              className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
            >
              Mã SKU định danh <span className="text-pink-600">*</span>
            </label>
            <input
              id="product-sku"
              type="text"
              disabled={isEditMode}
              {...register("sku")}
              placeholder="Ví dụ: LOR-INOA-60, OLA-NO4-250"
              className={`w-full h-11 px-3.5 rounded-xl border text-sm uppercase text-slate-900 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 transition-all ${
                isEditMode ? "opacity-60 cursor-not-allowed bg-slate-100" : ""
              } ${
                errors.sku
                  ? "border-rose-400 focus:ring-rose-400/30"
                  : "border-slate-200 focus:border-pink-500 focus:ring-pink-500/20"
              }`}
            />
            {errors.sku && (
              <p className="mt-1 text-xs text-rose-600 font-medium">{errors.sku.message}</p>
            )}
            {isEditMode && (
              <p className="mt-1 text-[11px] text-slate-400">Mã SKU là duy nhất và không thể thay đổi</p>
            )}
          </div>

          <div>
            <label
              htmlFor="product-barcode"
              className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
            >
              Mã vạch Barcode (tùy chọn)
            </label>
            <input
              id="product-barcode"
              type="text"
              {...register("barcode")}
              placeholder="Quét mã vạch hoặc nhập số EAN/UPC..."
              className="w-full h-11 px-3.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 transition-all placeholder:text-slate-400"
            />
          </div>
        </div>

        {/* Packaging Unit & Volume Specs */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-4">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
            Quy cách đóng gói & Dung tích thực
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            {/* Packaging Unit */}
            <div>
              <label
                htmlFor="product-unit"
                className="block text-[11px] font-bold text-slate-600 uppercase mb-1"
              >
                Đơn vị tính (Gốc) <span className="text-pink-600">*</span>
              </label>
              <select
                id="product-unit"
                {...register("unit")}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 focus:border-pink-500 focus:ring-1 focus:ring-pink-500 cursor-pointer"
              >
                {PACKAGING_UNITS.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>

            {/* Volume per Unit */}
            <div>
              <label
                htmlFor="product-volume"
                className="block text-[11px] font-bold text-slate-600 uppercase mb-1"
              >
                Dung tích/Khối lượng <span className="text-pink-600">*</span>
              </label>
              <input
                id="product-volume"
                type="number"
                min="0.1"
                step="0.5"
                {...register("volumeOrWeightPerUnit")}
                placeholder="500"
                className={`w-full h-10 px-3 rounded-xl border text-xs text-slate-900 bg-white focus:border-pink-500 focus:ring-1 focus:ring-pink-500 ${
                  errors.volumeOrWeightPerUnit ? "border-rose-400" : "border-slate-200"
                }`}
              />
              {errors.volumeOrWeightPerUnit && (
                <p className="mt-1 text-[11px] text-rose-600 font-medium">
                  {errors.volumeOrWeightPerUnit.message}
                </p>
              )}
            </div>

            {/* Volume Unit */}
            <div>
              <label
                htmlFor="product-volume-unit"
                className="block text-[11px] font-bold text-slate-600 uppercase mb-1"
              >
                Đơn vị thể tích <span className="text-pink-600">*</span>
              </label>
              <select
                id="product-volume-unit"
                {...register("volumeUnit")}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 focus:border-pink-500 focus:ring-1 focus:ring-pink-500 cursor-pointer"
              >
                {VOLUME_UNITS.map((vu) => (
                  <option key={vu} value={vu}>
                    {vu}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Pricing & Min Stock Alert */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label
              htmlFor="product-cost-price"
              className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
            >
              Giá vốn tiêu chuẩn (VND)
            </label>
            <div className="relative">
              <input
                id="product-cost-price"
                type="number"
                min="0"
                step="5000"
                {...register("costPrice")}
                className={`w-full h-11 pl-3.5 pr-14 rounded-xl border text-sm text-slate-900 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 transition-all ${
                  errors.costPrice
                    ? "border-rose-400 focus:ring-rose-400/30"
                    : "border-slate-200 focus:border-pink-500 focus:ring-pink-500/20"
                }`}
              />
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 pointer-events-none">
                VNĐ
              </div>
            </div>
            <p className="mt-1 text-[11px] text-slate-500 font-medium">
              {formatCurrency(Number(watchedCostPrice) || 0)}
            </p>
          </div>

          <div>
            <label
              htmlFor="product-retail-price"
              className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
            >
              Giá bán lẻ (nếu có)
            </label>
            <div className="relative">
              <input
                id="product-retail-price"
                type="number"
                min="0"
                step="5000"
                {...register("retailPrice")}
                className={`w-full h-11 pl-3.5 pr-14 rounded-xl border text-sm text-slate-900 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 transition-all ${
                  errors.retailPrice
                    ? "border-rose-400 focus:ring-rose-400/30"
                    : "border-slate-200 focus:border-pink-500 focus:ring-pink-500/20"
                }`}
              />
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 pointer-events-none">
                VNĐ
              </div>
            </div>
            <p className="mt-1 text-[11px] text-slate-500 font-medium">
              {formatCurrency(Number(watchedRetailPrice) || 0)}
            </p>
          </div>

          <div>
            <label
              htmlFor="product-min-stock"
              className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
            >
              Ngưỡng cảnh báo hết hàng
            </label>
            <div className="relative">
              <input
                id="product-min-stock"
                type="number"
                min="0"
                step="1"
                {...register("minStockAlertUnits")}
                className={`w-full h-11 pl-3.5 pr-14 rounded-xl border text-sm text-slate-900 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 transition-all ${
                  errors.minStockAlertUnits
                    ? "border-rose-400 focus:ring-rose-400/30"
                    : "border-slate-200 focus:border-pink-500 focus:ring-pink-500/20"
                }`}
              />
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 pointer-events-none">
                kiện
              </div>
            </div>
          </div>
        </div>

        {/* Active Toggle */}
        <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
          <div>
            <span className="text-sm font-bold text-slate-900">Trạng thái sử dụng</span>
            <p className="text-xs text-slate-500">
              Sản phẩm có sẵn để cấu hình BOM dịch vụ và nhập xuất tồn kho
            </p>
          </div>

          <label className="relative inline-flex items-center cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center">
            <input
              type="checkbox"
              {...register("isActive")}
              className="sr-only peer"
              aria-label="Kích hoạt sản phẩm"
            />
            <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[12px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pink-600" />
          </label>
        </div>
      </form>

      {/* Modal Footer */}
      <div className="flex items-center justify-end gap-2.5 px-6 py-4 border-t border-slate-100 bg-slate-50/80">
        <button
          type="button"
          onClick={onClose}
          disabled={isSubmitting}
          className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold text-xs transition-colors cursor-pointer disabled:opacity-50 min-h-[44px]"
        >
          Hủy bỏ
        </button>

        <button
          type="submit"
          form="product-form"
          disabled={isSubmitting}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-pink-600 to-rose-500 hover:from-pink-700 hover:to-rose-600 text-white font-semibold text-xs shadow-md shadow-pink-500/20 active:scale-[0.99] transition-all flex items-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed min-h-[44px]"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
              <span>Đang lưu...</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
              <span>{isEditMode ? "Lưu thay đổi" : "Tạo sản phẩm mới"}</span>
            </>
          )}
        </button>
      </div>
    </>
  );
}

export function ProductFormModal({
  isOpen,
  onClose,
  initialData = null,
  onSubmit,
  isSubmitting = false,
}) {
  const titleId = useId();

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen && !isSubmitting) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="presentation"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative w-full max-w-2xl my-6 bg-white rounded-3xl shadow-2xl border border-slate-200/90 flex flex-col max-h-[92vh] overflow-hidden animate-in zoom-in-95 duration-200"
      >
        <ProductFormInner
          key={initialData?.id ? `edit-${initialData.id}` : "create"}
          initialData={initialData}
          onClose={onClose}
          onSubmit={onSubmit}
          isSubmitting={isSubmitting}
          titleId={titleId}
        />
      </div>
    </div>
  );
}
