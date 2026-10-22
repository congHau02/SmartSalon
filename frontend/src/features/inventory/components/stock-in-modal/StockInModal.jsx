import React, { useEffect, useId } from "react";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { useProducts } from "../../useInventory";
import { useStockInForm } from "./useStockInForm";
import { StockInHeader } from "./StockInHeader";
import { StockInInputs } from "./StockInInputs";

function StockInInner({
  branchName,
  preselectedProductId = null,
  onClose,
  onSubmit,
  isSubmitting,
  titleId,
}) {
  const { data: products = [], isLoading: isLoadingProducts } = useProducts({
    activeOnly: true,
  });

  const {
    register,
    errors,
    watchedProductId,
    selectedProduct,
    totalVolumeAdded,
    totalCostEstimate,
    onProductChange,
    onFormSubmit,
  } = useStockInForm({ preselectedProductId, products, onSubmit });

  const hasErrors = Object.keys(errors).length > 0;

  return (
    <>
      <StockInHeader
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
            Vui lòng kiểm tra lại thông tin nhập kho bên dưới.
          </div>
        </div>
      )}

      <form id="stock-in-form" onSubmit={onFormSubmit} className="flex-1 overflow-y-auto p-6 space-y-4.5">
        <div>
          <label
            htmlFor="stock-product"
            className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
          >
            Sản phẩm master nhập về <span className="text-emerald-600">*</span>
          </label>
          {isLoadingProducts ? (
            <div className="h-11 flex items-center px-3.5 rounded-xl border border-slate-200 text-xs text-slate-400">
              <Loader2 className="w-4 h-4 animate-spin mr-2" aria-hidden="true" />
              Đang tải danh mục sản phẩm...
            </div>
          ) : (
            <select
              id="stock-product"
              value={watchedProductId}
              aria-invalid={Boolean(errors.productId)}
              aria-describedby={errors.productId ? "stock-product-error" : undefined}
              onChange={(e) => onProductChange(e.target.value)}
              className={`w-full h-11 px-3.5 rounded-xl border text-sm text-slate-900 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 cursor-pointer transition-all ${
                errors.productId
                  ? "border-rose-400 focus:ring-rose-400/30"
                  : "border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/20"
              }`}
            >
              <option value="">-- Chọn sản phẩm trong catalog --</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.sku}) - {p.volumeOrWeightPerUnit} {p.volumeUnit}/{p.unit}
                </option>
              ))}
            </select>
          )}
          {errors.productId && (
            <p id="stock-product-error" className="mt-1 text-xs text-rose-600 font-medium">
              {errors.productId.message}
            </p>
          )}
        </div>

        <StockInInputs
          selectedProduct={selectedProduct}
          register={register}
          errors={errors}
          totalCostEstimate={totalCostEstimate}
          totalVolumeAdded={totalVolumeAdded}
        />

        <div>
          <label
            htmlFor="stock-notes"
            className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
          >
            Ghi chú nhập kho / Số lô / Nhà cung cấp
          </label>
          <textarea
            id="stock-notes"
            rows={2}
            {...register("notes")}
            placeholder="Ví dụ: Lô hàng nhập từ NPP L'Oreal Việt Nam, HĐ 9812..."
            className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:bg-white focus:outline-none transition-all placeholder:text-slate-400"
          />
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
          form="stock-in-form"
          disabled={isSubmitting}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 text-white font-semibold text-xs shadow-md shadow-emerald-600/20 active:scale-[0.99] transition-all flex items-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed min-h-[44px]"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
              <span>Đang nhập kho...</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
              <span>Xác nhận nhập kho</span>
            </>
          )}
        </button>
      </div>
    </>
  );
}

export function StockInModal({
  isOpen,
  onClose,
  branchName,
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
        <StockInInner
          key={preselectedProductId ? `prod-${preselectedProductId}` : "stockin"}
          branchName={branchName}
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
