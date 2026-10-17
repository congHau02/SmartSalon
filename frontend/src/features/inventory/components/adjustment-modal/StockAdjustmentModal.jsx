import React, { useEffect, useId } from "react";
import {
  X,
  Scale,
  Building2,
  AlertCircle,
  CheckCircle2,
  Loader2,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { useProducts } from "../../useInventory";
import { ADJUSTMENT_REASONS } from "../../constants";
import { useStockAdjustmentForm } from "./useStockAdjustmentForm";

function StockAdjustmentInner({
  branchName,
  inventoryItems = [],
  preselectedProductId = null,
  onClose,
  onSubmit,
  isSubmitting,
  titleId,
}) {
  const { data: allCatalogProducts = [] } = useProducts({ activeOnly: true });

  const {
    register,
    setValue,
    errors,
    availableOptions,
    selectedItem,
    watchedProductId,
    watchedIsCustomReason,
    volumeDelta,
    onProductChange,
    onFormSubmit,
  } = useStockAdjustmentForm({
    allCatalogProducts,
    inventoryItems,
    preselectedProductId,
    onSubmit,
  });

  const hasErrors = Object.keys(errors).length > 0;

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4.5 border-b border-slate-100 bg-slate-50/60">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
            <Scale className="w-5 h-5" aria-hidden="true" />
          </div>
          <div>
            <h2 id={titleId} className="text-lg font-bold text-slate-900 leading-tight">
              Kiểm kê & Điều chỉnh Tồn kho Thực tế
            </h2>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
              <Building2 className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
              <span>
                Kho chi nhánh: <strong className="text-slate-700">{branchName || "Chi nhánh hiện tại"}</strong>
              </span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          disabled={isSubmitting}
          aria-label="Đóng cửa sổ"
          className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
        >
          <X className="w-5 h-5" aria-hidden="true" />
        </button>
      </div>

      {/* Errors Banner */}
      {hasErrors && (
        <div
          role="alert"
          className="mx-6 mt-4 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2.5 animate-in fade-in"
        >
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" aria-hidden="true" />
          <div className="flex-1 font-medium">
            Có số liệu kiểm kê chưa hợp lệ. Vui lòng kiểm tra lại.
          </div>
        </div>
      )}

      {/* Form Content */}
      <form id="adjustment-form" onSubmit={onFormSubmit} className="flex-1 overflow-y-auto p-6 space-y-4.5">
        {/* Product Selection */}
        <div>
          <label
            htmlFor="adj-product"
            className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
          >
            Sản phẩm cần kiểm kê <span className="text-amber-600">*</span>
          </label>
          <select
            id="adj-product"
            value={watchedProductId}
            aria-invalid={Boolean(errors.productId)}
            aria-describedby={errors.productId ? "adj-product-error" : undefined}
            onChange={(e) => onProductChange(e.target.value)}
            className="w-full h-11 px-3.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 cursor-pointer transition-all"
          >
            <option value="">-- Chọn sản phẩm kiểm kê --</option>
            {availableOptions.map((item) => (
              <option key={item.productId} value={item.productId}>
                {item.productName} ({item.productSku}) {item.isExistingInBranch ? `- Kho có: ${item.stockUnits} ${item.packagingUnit} + ${item.currentVolume}${item.volumeUnit}` : "(Chưa có tồn tại chi nhánh)"}
              </option>
            ))}
          </select>
          {errors.productId && (
            <p id="adj-product-error" className="mt-1 text-xs text-rose-600 font-medium">
              {errors.productId.message}
            </p>
          )}
        </div>

        {/* Comparison System vs Actual */}
        {selectedItem && (
          <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200/80 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-amber-900">Số liệu hệ thống đang ghi nhận:</span>
              <span className="font-extrabold text-slate-800">
                {selectedItem.isExistingInBranch ? (
                  `${selectedItem.stockUnits} ${selectedItem.packagingUnit} nguyên seal + ${selectedItem.currentVolume} ${selectedItem.volumeUnit} dở dang`
                ) : (
                  `Chưa có tồn kho (0 ${selectedItem.packagingUnit} nguyên seal + 0 ${selectedItem.volumeUnit} dở)`
                )}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
              {/* Actual Sealed Units */}
              <div>
                <label
                  htmlFor="adj-actual-units"
                  className="block text-[11px] font-bold text-slate-700 uppercase mb-1"
                >
                  Số {selectedItem.packagingUnit} nguyên seal thực đếm <span className="text-amber-600">*</span>
                </label>
                <div className="relative">
                  <input
                    id="adj-actual-units"
                    type="number"
                    min="0"
                    step="1"
                    {...register("actualStockUnits")}
                    aria-invalid={Boolean(errors.actualStockUnits)}
                    aria-describedby={errors.actualStockUnits ? "adj-actual-units-error" : undefined}
                    className={`w-full h-10 pl-3 pr-14 rounded-xl border text-xs text-slate-900 bg-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500 ${
                      errors.actualStockUnits ? "border-rose-400" : "border-slate-200"
                    }`}
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 pointer-events-none">
                    {selectedItem.packagingUnit}
                  </div>
                </div>
                {errors.actualStockUnits && (
                  <p id="adj-actual-units-error" className="mt-1 text-[11px] text-rose-600 font-medium">
                    {errors.actualStockUnits.message}
                  </p>
                )}
              </div>

              {/* Actual In-Use Volume */}
              <div>
                <label
                  htmlFor="adj-actual-volume"
                  className="block text-[11px] font-bold text-slate-700 uppercase mb-1"
                >
                  Dung tích chai đang dùng dở <span className="text-amber-600">*</span>
                </label>
                <div className="relative">
                  <input
                    id="adj-actual-volume"
                    type="number"
                    min="0"
                    step="1"
                    {...register("actualVolume")}
                    aria-invalid={Boolean(errors.actualVolume)}
                    aria-describedby={errors.actualVolume ? "adj-actual-volume-error" : undefined}
                    className={`w-full h-10 pl-3 pr-14 rounded-xl border text-xs text-slate-900 bg-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500 ${
                      errors.actualVolume ? "border-rose-400" : "border-slate-200"
                    }`}
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 pointer-events-none">
                    {selectedItem.volumeUnit}
                  </div>
                </div>
                {errors.actualVolume && (
                  <p id="adj-actual-volume-error" className="mt-1 text-[11px] text-rose-600 font-medium">
                    {errors.actualVolume.message}
                  </p>
                )}
              </div>
            </div>

            {/* Discrepancy / Variance Indicator */}
            <div className="pt-2 border-t border-amber-200/60 flex items-center justify-between text-xs">
              <span className="text-slate-600 font-medium">Chênh lệch sau kiểm kê:</span>
              <div className="flex items-center gap-1.5 font-bold">
                {volumeDelta === 0 ? (
                  <span className="text-emerald-700">Khớp số liệu hoàn hảo (0 {selectedItem.volumeUnit})</span>
                ) : volumeDelta > 0 ? (
                  <span className="inline-flex items-center gap-1 text-emerald-700">
                    <TrendingUp className="w-3.5 h-3.5" aria-hidden="true" />
                    +{new Intl.NumberFormat("vi-VN").format(volumeDelta)} {selectedItem.volumeUnit} (Thừa kho)
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-rose-700">
                    <TrendingDown className="w-3.5 h-3.5" aria-hidden="true" />
                    {new Intl.NumberFormat("vi-VN").format(volumeDelta)} {selectedItem.volumeUnit} (Hao hụt)
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Reason Selection */}
        <div>
          <label
            htmlFor="adj-reason"
            className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
          >
            Lý do kiểm kê / điều chỉnh <span className="text-amber-600">*</span>
          </label>
          <div className="space-y-2.5">
            <select
              id="adj-reason"
              {...register("reason", {
                onChange: (e) => {
                  if (e.target.value === "__custom__") {
                    setValue("isCustomReason", true);
                  } else {
                    setValue("isCustomReason", false);
                  }
                },
              })}
              aria-invalid={Boolean(errors.reason)}
              aria-describedby={errors.reason ? "adj-reason-error" : undefined}
              className="w-full h-11 px-3.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 cursor-pointer transition-all"
            >
              {ADJUSTMENT_REASONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
              <option value="__custom__">+ Nhập lý do giải trình khác...</option>
            </select>

            {watchedIsCustomReason && (
              <textarea
                rows={2}
                {...register("customReason")}
                aria-invalid={Boolean(errors.reason)}
                aria-describedby={errors.reason ? "adj-reason-error" : undefined}
                placeholder="Nhập chi tiết biên bản kiểm kê hoặc lý do hao hụt..."
                className="w-full p-3 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all placeholder:text-slate-400"
              />
            )}
          </div>
          {(errors.reason || errors.customReason) && (
            <p id="adj-reason-error" className="mt-1 text-xs text-rose-600 font-medium">
              {errors.reason?.message || errors.customReason?.message}
            </p>
          )}
        </div>
      </form>

      {/* Footer */}
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
          form="adjustment-form"
          disabled={isSubmitting}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-orange-500 hover:from-amber-700 hover:to-orange-600 text-white font-semibold text-xs shadow-md shadow-amber-600/20 active:scale-[0.99] transition-all flex items-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed min-h-[44px]"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
              <span>Đang cân đối...</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
              <span>Xác nhận điều chỉnh</span>
            </>
          )}
        </button>
      </div>
    </>
  );
}

export function StockAdjustmentModal({
  isOpen,
  onClose,
  branchName,
  inventoryItems = [],
  preselectedProductId = null,
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
        className="relative w-full max-w-xl my-6 bg-white rounded-3xl shadow-2xl border border-slate-200/90 flex flex-col max-h-[92vh] overflow-hidden animate-in zoom-in-95 duration-200"
      >
        <StockAdjustmentInner
          key={preselectedProductId ? `adj-${preselectedProductId}` : "adjust"}
          branchName={branchName}
          inventoryItems={inventoryItems}
          preselectedProductId={preselectedProductId}
          onClose={onClose}
          onSubmit={onSubmit}
          isSubmitting={isSubmitting}
          titleId={titleId}
        />
      </div>
    </div>
  );
}
