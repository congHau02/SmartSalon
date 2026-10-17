import React, { useEffect, useId } from "react";
import {
  X,
  AlertCircle,
  FlaskConical,
  Layers,
  Sparkles,
  Info,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { useMasterProducts } from "../../useServices";
import { useServiceForm } from "./useServiceForm";
import { ServiceBasicInfoFields } from "./ServiceBasicInfoFields";
import { ServiceBomTable } from "./ServiceBomTable";
import { ServiceStepsTable } from "./ServiceStepsTable";

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
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4.5 border-b border-slate-100 bg-slate-50/60">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-pink-100 text-pink-700 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5" aria-hidden="true" />
          </div>
          <div>
            <h2 id={titleId} className="text-lg font-bold text-slate-900 leading-tight">
              {isEditMode ? "Chỉnh sửa Dịch vụ & Công thức BOM" : "Thêm Dịch vụ Mới vào Danh mục"}
            </h2>
            <p className="text-xs text-slate-500">
              Thiết lập định lượng hoá chất tiêu hao và tỷ lệ chia hoa hồng cho từng thợ
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

      {/* Global Error Banner if any validation fails */}
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

      {/* Navigation Tabs */}
      <div className="flex items-center px-6 pt-3 border-b border-slate-200/80 gap-2 bg-white">
        <button
          type="button"
          onClick={() => setActiveTab("basic")}
          className={`flex items-center gap-2 py-3 px-3.5 border-b-2 text-xs font-bold transition-all cursor-pointer min-h-[44px] ${
            activeTab === "basic"
              ? "border-pink-600 text-pink-700"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Info className="w-4 h-4" />
          <span>Thông tin cơ bản</span>
          {hasBasicErrors && <span className="w-2 h-2 rounded-full bg-rose-500" />}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("bom")}
          className={`flex items-center gap-2 py-3 px-3.5 border-b-2 text-xs font-bold transition-all cursor-pointer min-h-[44px] ${
            activeTab === "bom"
              ? "border-pink-600 text-pink-700"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <FlaskConical className="w-4 h-4" />
          <span>Định mức BOM ({bomFields.length})</span>
          {hasBomErrors && <span className="w-2 h-2 rounded-full bg-rose-500" />}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("steps")}
          className={`flex items-center gap-2 py-3 px-3.5 border-b-2 text-xs font-bold transition-all cursor-pointer min-h-[44px] ${
            activeTab === "steps"
              ? "border-pink-600 text-pink-700"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>
            Quy trình & Hoa hồng ({stepFields.length} bước - {totalCommission}%)
          </span>
          {(isCommissionExceeded || hasStepErrors) && (
            <span className="w-2 h-2 rounded-full bg-rose-500" />
          )}
        </button>
      </div>

      {/* Tab Contents Form Body */}
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

      {/* Modal Footer Controls */}
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

  // Handle ESC key to dismiss
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
