import React from "react";
import { Layers, Plus, Trash2, AlertCircle } from "lucide-react";
import { STEP_TEMPLATES } from "../../constants";

export function ServiceStepsTable({
  stepFields,
  register,
  errors,
  totalCommission,
  isCommissionExceeded,
  handleAddStep,
  removeStep,
  handleApplyTemplate,
}) {
  return (
    <div className="space-y-4 animate-in fade-in duration-150">
      {/* Commission Summary Bar */}
      <div
        className={`p-4 rounded-2xl border transition-all ${
          isCommissionExceeded
            ? "bg-rose-50 border-rose-300 text-rose-900"
            : "bg-slate-50 border-slate-200 text-slate-800"
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <Layers
              className={`w-4 h-4 ${
                isCommissionExceeded ? "text-rose-600" : "text-pink-600"
              }`}
            />
            <span className="font-bold text-xs uppercase tracking-wider">
              Tổng tỷ lệ hoa hồng kỹ thuật:
            </span>
            <span
              className={`text-sm font-extrabold ${
                isCommissionExceeded ? "text-rose-600" : "text-pink-700"
              }`}
            >
              {totalCommission}% / 100%
            </span>
          </div>

          <span className="text-[11px] font-medium text-slate-500">
            {isCommissionExceeded ? (
              <span className="text-rose-600 font-bold">Vượt quá mức trần tối đa!</span>
            ) : (
              `Salon giữ lại: ${Math.max(0, 100 - totalCommission)}% doanh thu`
            )}
          </span>
        </div>

        {/* Progress bar */}
        <div className="w-full h-2.5 rounded-full bg-slate-200 overflow-hidden">
          <div
            className={`h-full transition-all duration-300 rounded-full ${
              isCommissionExceeded ? "bg-rose-500" : "bg-gradient-to-r from-pink-500 to-rose-400"
            }`}
            style={{ width: `${Math.min(totalCommission, 100)}%` }}
          />
        </div>

        {errors?.commission && (
          <p className="mt-2 text-xs text-rose-600 font-bold flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{errors.commission.message}</span>
          </p>
        )}
      </div>

      {/* Quick Preset Buttons */}
      <div className="space-y-1.5">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
          Mẫu quy trình phân bổ nhanh:
        </span>
        <div className="flex flex-wrap gap-2">
          {STEP_TEMPLATES.map((tpl) => (
            <button
              key={tpl.name}
              type="button"
              onClick={() => handleApplyTemplate(tpl)}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-pink-50 hover:text-pink-700 hover:border-pink-200 border border-slate-200 text-xs font-semibold text-slate-700 transition-all cursor-pointer min-h-[36px]"
            >
              {tpl.name}
            </button>
          ))}
        </div>
      </div>

      {/* Steps List */}
      <div className="space-y-3 pt-2">
        {stepFields.map((field, index) => {
          const stepError = errors?.defaultSteps?.[index];
          return (
            <div
              key={field.id}
              className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center gap-3 transition-all hover:border-slate-300"
            >
              <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs shrink-0">
                #{index + 1}
              </div>

              {/* Step Name */}
              <div className="flex-1 min-w-0">
                <label htmlFor={`step-name-${index}`} className="sr-only">
                  Tên bước kỹ thuật #{index + 1}
                </label>
                <input
                  id={`step-name-${index}`}
                  type="text"
                  {...register(`defaultSteps.${index}.stepName`)}
                  placeholder="Tên bước (vd: Cắt tạo dáng, Lên trục, Gội massage...)"
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs text-slate-900 focus:border-pink-500 focus:ring-1 focus:ring-pink-500"
                />
                {stepError?.stepName && (
                  <p className="mt-1 text-[11px] text-rose-600 font-medium">
                    {stepError.stepName.message}
                  </p>
                )}
              </div>

              {/* Commission Rate */}
              <div className="w-32 shrink-0 relative">
                <label htmlFor={`step-rate-${index}`} className="sr-only">
                  Tỷ lệ hoa hồng %
                </label>
                <input
                  id={`step-rate-${index}`}
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  {...register(`defaultSteps.${index}.commissionRate`)}
                  placeholder="15"
                  className="w-full h-10 pl-3 pr-8 rounded-xl border border-slate-200 text-xs text-slate-900 focus:border-pink-500 focus:ring-1 focus:ring-pink-500"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 pointer-events-none">
                  %
                </div>
                {stepError?.commissionRate && (
                  <p className="mt-1 text-[11px] text-rose-600 font-medium">
                    {stepError.commissionRate.message}
                  </p>
                )}
              </div>

              {/* Remove Step */}
              <button
                type="button"
                onClick={() => removeStep(index)}
                aria-label={`Xóa bước kỹ thuật ${index + 1}`}
                className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
              >
                <Trash2 className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          );
        })}

        <button
          type="button"
          onClick={handleAddStep}
          className="w-full min-h-[44px] py-2.5 rounded-xl border-2 border-dashed border-slate-200 hover:border-pink-300 hover:bg-pink-50/40 text-xs font-bold text-slate-600 hover:text-pink-700 transition-all flex items-center justify-center gap-2 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500"
        >
          <Plus className="w-4 h-4" aria-hidden="true" />
          <span>Thêm bước kỹ thuật</span>
        </button>
      </div>
    </div>
  );
}
