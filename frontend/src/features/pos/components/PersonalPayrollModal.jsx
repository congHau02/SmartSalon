import React from "react";
import { X, Sparkles, AlertCircle, RefreshCw, Loader2 } from "lucide-react";
import { useMyPayroll } from "../useMyPayroll";
import { PersonalPayrollPeriodBar } from "./PersonalPayrollPeriodBar";
import { PersonalPayrollKpis } from "./PersonalPayrollKpis";
import { PersonalPayrollLedgerTable } from "./PersonalPayrollLedgerTable";

export function PersonalPayrollModal({ isOpen, onClose }) {
  const {
    payroll,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
    preset,
    selectPreset,
    startDate,
    setCustomStartDate,
    endDate,
    setCustomEndDate,
  } = useMyPayroll({ enabled: isOpen });

  if (!isOpen) return null;

  const staffName = payroll?.fullName || payroll?.username || "Nhân viên";
  const staffRole = payroll?.roles?.[0] || "STAFF";
  const branchName = payroll?.branchName || "";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="my-payroll-title"
    >
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] text-slate-100">
        {/* Modal Header */}
        <div className="p-4 bg-slate-800/90 border-b border-slate-700 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-pink-600 to-rose-400 text-white flex items-center justify-center shadow-md shadow-pink-900/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="my-payroll-title" className="text-base font-bold text-white">
                  Lương & Thu nhập của tôi
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-pink-500/20 text-pink-300 border border-pink-500/30">
                  {staffRole}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Bảng kê thu nhập cá nhân bảo mật cho <strong>{staffName}</strong>
                {branchName && <span> • {branchName}</span>}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Đóng bảng kê thu nhập"
            className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-400 hover:text-white hover:bg-slate-700/70 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Period Filter Bar */}
        <PersonalPayrollPeriodBar
          preset={preset}
          onSelectPreset={selectPreset}
          startDate={startDate}
          onStartDateChange={setCustomStartDate}
          endDate={endDate}
          onEndDateChange={setCustomEndDate}
          onRefresh={() => refetch()}
          isRefreshing={isRefetching}
        />

        {/* Modal Body */}
        {isLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-slate-400 space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
            <p className="text-xs font-semibold">Đang tải bảng kê thu nhập cá nhân...</p>
          </div>
        ) : isError ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-400 flex items-center justify-center">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <div className="text-sm font-bold text-white">Không thể tải bảng kê thu nhập</div>
              <p className="text-xs text-rose-400 mt-1 max-w-sm">
                {error?.response?.data?.message || error?.message || "Đã xảy ra lỗi khi tải dữ liệu."}
              </p>
            </div>
            <button
              onClick={() => refetch()}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white border border-slate-700 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Thử lại
            </button>
          </div>
        ) : (
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            <PersonalPayrollKpis payroll={payroll} />
            <PersonalPayrollLedgerTable ledgers={payroll?.commissionLedgers || []} />
          </div>
        )}

        {/* Modal Footer */}
        <div className="p-3.5 bg-slate-800/80 border-t border-slate-700/80 flex items-center justify-between text-xs text-slate-400 shrink-0">
          <span>Dữ liệu hạch toán tự động từ hệ thống SmartSalon Analytics & POS</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-bold text-xs transition-colors cursor-pointer min-h-[40px]"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
