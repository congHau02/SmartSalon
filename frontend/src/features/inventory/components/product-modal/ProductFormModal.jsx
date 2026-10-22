import React, { useEffect, useId } from "react";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { useProductForm } from "./useProductForm";
import { ProductModalHeader } from "./ProductModalHeader";
import { ProductIdentityFields } from "./ProductIdentityFields";
import { ProductSpecsAndPricingFields } from "./ProductSpecsAndPricingFields";

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
      <ProductModalHeader
        isEditMode={isEditMode}
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
            Có thông tin chưa hợp lệ. Vui lòng kiểm tra lại các trường được đánh dấu đỏ bên dưới.
          </div>
        </div>
      )}

      <form id="product-form" onSubmit={onFormSubmit} className="flex-1 overflow-y-auto p-6 space-y-4.5">
        <ProductIdentityFields
          register={register}
          errors={errors}
          isEditMode={isEditMode}
        />

        <ProductSpecsAndPricingFields
          register={register}
          errors={errors}
          watchedCostPrice={watchedCostPrice}
          watchedRetailPrice={watchedRetailPrice}
        />
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
