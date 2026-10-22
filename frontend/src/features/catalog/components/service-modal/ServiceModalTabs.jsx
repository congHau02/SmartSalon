import React from "react";
import { Info, FlaskConical, Layers } from "lucide-react";

export function ServiceModalTabs({
  activeTab,
  setActiveTab,
  counts,
  commission,
  errors,
  // Graceful fallbacks for legacy prop shape
  bomCount = counts?.bom || 0,
  stepCount = counts?.steps || 0,
  totalCommission = commission?.total || 0,
  isCommissionExceeded = commission?.isExceeded || false,
  hasBasicErrors = errors?.basic || false,
  hasBomErrors = errors?.bom || false,
  hasStepErrors = errors?.steps || false,
}) {
  return (
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
        <span>Định mức BOM ({bomCount})</span>
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
          Bước kỹ thuật & Hoa hồng ({stepCount} bước - {totalCommission}%)
        </span>
        {(isCommissionExceeded || hasStepErrors) && (
          <span className="w-2 h-2 rounded-full bg-rose-500" />
        )}
      </button>
    </div>
  );
}
