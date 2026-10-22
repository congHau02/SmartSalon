import React, { useEffect, useId } from "react";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { useProducts } from "../../useInventory";
import { ADJUSTMENT_REASONS } from "../../constants";
import { useStockAdjustmentForm } from "./useStockAdjustmentForm";
import { StockAdjustmentHeader } from "./StockAdjustmentHeader";
import { StockAdjustmentComparison } from "./StockAdjustmentComparison";

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
      <StockAdjustmentHeader
        branchName={branchName}
        titleId={titleId}
        onClose={onClose}
        isSubmitting={isSubmitting}
      />

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

      <form id="adjustment-form" onSubmit={onFormSubmit} className="flex-1 overflow-y-auto p-6 space-y-4.5">
        <div>
          <label
            htmlFor="adj-product"
            className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
          >
            Sản phẩm cần kiểm kê <span className="text-amber-600">*</span>
          </label>
          <select
            id="adj-product"
            {...register("productId", {
              onChange: (e) => onProductChange(e.target.value),
            })}
            aria-invalid={Boolean(errors.productId)}
            aria-describedby={errors.productId ? "adj-product-error" : undefined}
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

        <StockAdjustmentComparison
          selectedItem={selectedItem}
          register={register}
          errors={errors}
          volumeDelta={volumeDelta}
        />

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
