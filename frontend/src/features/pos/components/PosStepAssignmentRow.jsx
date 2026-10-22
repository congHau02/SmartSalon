import React from "react";
import { User, Play, Check, CheckCircle2 } from "lucide-react";
import { formatCurrency } from "../../../lib/utils";

export function PosStepAssignmentRow({
  step,
  stylists = [],
  isOrderSettled,
  onUpdateAssignment,
  onUpdateStatus,
  isStatusPending,
}) {
  const isStepInProgress = step.status === "IN_PROGRESS";
  const isStepCompleted = step.status === "COMPLETED";

  return (
    <div
      className={`p-2.5 rounded-lg border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 transition-all ${
        isStepCompleted
          ? "bg-slate-900/60 border-emerald-500/20 text-slate-300"
          : isStepInProgress
          ? "bg-slate-900 border-amber-500/40 text-white shadow-amber-500/5 shadow-md"
          : "bg-slate-900/40 border-slate-750 text-slate-300"
      }`}
    >
      {/* Step Name & Status */}
      <div className="flex items-center gap-2 min-w-[140px]">
        <span
          className={`w-2 h-2 rounded-full shrink-0 ${
            isStepCompleted
              ? "bg-emerald-400"
              : isStepInProgress
              ? "bg-amber-400 animate-pulse"
              : "bg-slate-600"
          }`}
        />
        <span className="font-semibold text-slate-200">{step.stepName}</span>
      </div>

      {/* Staff Selector */}
      <div className="flex items-center gap-1.5 flex-1 max-w-xs">
        <User className="w-3.5 h-3.5 text-slate-500 shrink-0" />
        <select
          disabled={isOrderSettled}
          value={step.staffId || ""}
          aria-label={`Chỉ định nhân sự cho bước ${step.stepName}`}
          onChange={(e) => {
            const newStaffId = e.target.value ? Number(e.target.value) : null;
            if (newStaffId && newStaffId !== step.staffId) {
              onUpdateAssignment({
                stepId: step.id,
                data: { staffId: newStaffId, commissionRate: step.commissionRate },
              });
            }
          }}
          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-pink-500 cursor-pointer disabled:opacity-50"
        >
          <option value="">-- Chọn Stylist/Thợ --</option>
          {stylists.map((st) => (
            <option key={st.stylistId || st.id} value={st.stylistId || st.id}>
              {st.fullName || st.name}
            </option>
          ))}
        </select>
      </div>

      {/* Commission % Input & Live VND Preview */}
      <div className="flex items-center gap-2 shrink-0">
        <div className="flex items-center gap-1 bg-slate-800 px-2 py-1 rounded-lg border border-slate-700">
          <input
            key={`${step.id}-${step.commissionRate}`}
            type="number"
            min="0"
            max="100"
            step="5"
            disabled={isOrderSettled}
            defaultValue={step.commissionRate}
            aria-label={`Tỷ lệ hoa hồng cho bước ${step.stepName}`}
            onBlur={(e) => {
              const newRate = Number(e.target.value);
              if (!isNaN(newRate) && newRate !== step.commissionRate) {
                onUpdateAssignment({
                  stepId: step.id,
                  data: { staffId: step.staffId, commissionRate: newRate },
                });
              }
            }}
            className="w-12 text-center bg-transparent text-xs font-mono font-bold text-pink-400 focus:outline-none"
          />
          <span className="text-[11px] text-slate-400 font-semibold">%</span>
        </div>

        {/* Preview VND */}
        <div className="text-right min-w-[70px]">
          <span className="font-mono font-bold text-emerald-400 text-xs block">
            {formatCurrency(step.commissionAmount)}
          </span>
        </div>

        {/* Step Status Action Button */}
        {!isOrderSettled && (
          <div className="shrink-0">
            {step.status === "PENDING" && (
              <button
                type="button"
                onClick={() => onUpdateStatus({ stepId: step.id, data: { status: "IN_PROGRESS" } })}
                disabled={isStatusPending || !step.staffId}
                className="px-2.5 py-1 rounded-lg bg-pink-600 hover:bg-pink-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-[11px] flex items-center gap-1 shadow-sm transition-colors cursor-pointer"
                title={!step.staffId ? "Vui lòng phân công kỹ thuật viên trước khi bắt đầu" : "Bắt đầu thực hiện bước này"}
              >
                <Play className="w-3 h-3 fill-current" />
                <span>Bắt đầu</span>
              </button>
            )}

            {step.status === "IN_PROGRESS" && (
              <button
                type="button"
                onClick={() => onUpdateStatus({ stepId: step.id, data: { status: "COMPLETED" } })}
                disabled={isStatusPending || !step.staffId}
                className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-[11px] flex items-center gap-1 shadow-sm transition-colors cursor-pointer"
                title={!step.staffId ? "Vui lòng phân công kỹ thuật viên trước khi hoàn thành" : "Đánh dấu hoàn thành bước này"}
              >
                <Check className="w-3 h-3" />
                <span>Hoàn thành</span>
              </button>
            )}

            {step.status === "COMPLETED" && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                <CheckCircle2 className="w-3 h-3" />
                <span>Đã xong</span>
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
