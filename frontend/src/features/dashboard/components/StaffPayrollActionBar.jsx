import React from "react";
import { Users, RefreshCw, FileSpreadsheet, FileText, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "../../../components/ui/Button";

export function StaffPayrollActionBar({
  startDate,
  endDate,
  selectedBranch,
  isLoading,
  exportingXlsx,
  exportingPdf,
  handleExport,
  exportStatus,
  clearExportStatus,
}) {
  return (
    <>
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-slate-900 uppercase tracking-wider">
                Bảng Lương & Hiệu suất Nhân sự (Payroll & KPI)
              </span>
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-purple-50 text-purple-700 border border-purple-200/60">
                Lương cứng + Hoa hồng
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Kỳ: <span className="font-semibold text-slate-700">{startDate}</span> đến{" "}
              <span className="font-semibold text-slate-700">{endDate}</span> • Chi nhánh:{" "}
              <span className="font-semibold text-slate-700">
                {selectedBranch?.name || "Tất cả chi nhánh"}
              </span>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            type="button"
            variant="outline"
            disabled={exportingXlsx || isLoading}
            onClick={() => handleExport("xlsx")}
            className="text-xs font-bold gap-2 text-emerald-700 border-emerald-300 hover:bg-emerald-50 focus:ring-emerald-500/30"
          >
            {exportingXlsx ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-600" />
            ) : (
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            )}
            {exportingXlsx ? "Đang xuất Excel..." : "Xuất Excel (.xlsx)"}
          </Button>

          <Button
            type="button"
            variant="outline"
            disabled={exportingPdf || isLoading}
            onClick={() => handleExport("pdf")}
            className="text-xs font-bold gap-2 text-rose-700 border-rose-300 hover:bg-rose-50 focus:ring-rose-500/30"
          >
            {exportingPdf ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-rose-600" />
            ) : (
              <FileText className="w-3.5 h-3.5 text-rose-600" />
            )}
            {exportingPdf ? "Đang xuất PDF..." : "Xuất PDF (.pdf)"}
          </Button>
        </div>
      </div>

      {exportStatus && (
        <div
          className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border text-xs font-medium animate-in fade-in duration-200 ${
            exportStatus.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-rose-50 border-rose-200 text-rose-800"
          }`}
        >
          {exportStatus.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span className="flex-1">{exportStatus.message}</span>
          <button
            type="button"
            onClick={clearExportStatus}
            className="text-slate-400 hover:text-slate-600 font-bold ml-2 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}
    </>
  );
}
