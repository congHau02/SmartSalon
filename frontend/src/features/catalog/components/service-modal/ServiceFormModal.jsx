import React, { useEffect, useId } from "react";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { useMasterProducts } from "../../useServices";
import { useServiceForm } from "./useServiceForm";
import { ServiceBasicInfoFields } from "./ServiceBasicInfoFields";
import { ServiceBomTable } from "./ServiceBomTable";
import { ServiceStepsTable } from "./ServiceStepsTable";
import { ServiceModalTabs } from "./ServiceModalTabs";
import { ServiceModalHeader } from "./ServiceModalHeader";

function ServiceFormInner({
  initialData,
  onClose,
  onSubmit,
  isSubmitting,
  titleId,
}) {
  const { data: masterProducts = [] } = useMasterProducts({ activeOnly: true });

  const {
    isEditMode,
    activeTab,
    setActiveTab,
    register,
    setValue,
    errors,
    watchedBasePrice,
    watchedDuration,
    watchedIsCustom,
    bomFields,
    handleAddBomItem,
    handleProductSelect,
    removeBom,
    stepFields,
    totalCommission,
    isCommissionExceeded,
    handleAddStep,
    removeStep,
    handleApplyTemplate,
    onFormSubmit,
  } = useServiceForm({ initialData, onSubmit, masterProducts });

  const hasErrors = Object.keys(errors).length > 0;
  const hasBasicErrors = Boolean(
    errors.name || errors.category || errors.customCategory || errors.durationMinutes || errors.basePrice
  );
  const hasBomErrors = Boolean(errors.bomList);
  const hasStepErrors = Boolean(errors.commission || errors.defaultSteps);

  return (
    <>
      <ServiceModalHeader
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
            Có thông tin chưa hợp lệ. Vui lòng kiểm tra lại các mục được đánh dấu màu đỏ.
          </div>
        </div>
      )}

      <ServiceModalTabs
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        counts={{ bom: bomFields.length, steps: stepFields.length }}
        commission={{ total: totalCommission, isExceeded: isCommissionExceeded }}
        errors={{ basic: hasBasicErrors, bom: hasBomErrors, steps: hasStepErrors }}
      />

      <form id="service-form" onSubmit={onFormSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
        {activeTab === "basic" && (
          <ServiceBasicInfoFields
            register={register}
            errors={errors}
            watchedBasePrice={watchedBasePrice}
            watchedDuration={watchedDuration}
            watchedIsCustom={watchedIsCustom}
            setValue={setValue}
          />
        )}

        {activeTab === "bom" && (
          <ServiceBomTable
            bomFields={bomFields}
            register={register}
            errors={errors}
            handleAddBomItem={handleAddBomItem}
            handleProductSelect={handleProductSelect}
            removeBom={removeBom}
            masterProducts={masterProducts}
          />
        )}

        {activeTab === "steps" && (
          <ServiceStepsTable
            stepFields={stepFields}
            register={register}
            errors={errors}
            totalCommission={totalCommission}
            isCommissionExceeded={isCommissionExceeded}
            handleAddStep={handleAddStep}
            removeStep={removeStep}
            handleApplyTemplate={handleApplyTemplate}
          />
        )}
      </form>

      <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/80">
        <div className="text-xs text-slate-500">
          {activeTab === "basic" && "Bước 1/3: Thông tin cơ bản"}
          {activeTab === "bom" && `Bước 2/3: ${bomFields.length} vật tư định mức`}
          {activeTab === "steps" &&
            `Bước 3/3: ${stepFields.length} bước kỹ thuật (${totalCommission}% hoa hồng)`}
        </div>

        <div className="flex items-center gap-2.5">
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
            form="service-form"
            disabled={isSubmitting || isCommissionExceeded}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-pink-600 to-rose-500 hover:from-pink-700 hover:to-rose-600 text-white font-semibold text-xs shadow-md shadow-pink-500/20 active:scale-[0.99] transition-all flex items-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed min-h-[44px]"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Đang lưu...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>{isEditMode ? "Lưu thay đổi" : "Tạo dịch vụ mới"}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </>
  );
}

export function ServiceFormModal({
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
        className="relative w-full max-w-3xl my-6 bg-white rounded-3xl shadow-2xl border border-slate-200/90 flex flex-col max-h-[92vh] overflow-hidden animate-in zoom-in-95 duration-200"
      >
        <ServiceFormInner
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
