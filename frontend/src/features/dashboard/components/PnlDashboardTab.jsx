import React, { useState } from "react";
import { PnlSummaryCards } from "./PnlSummaryCards";
import { PnlTrendChart } from "./PnlTrendChart";
import { OrderPnlTable } from "./OrderPnlTable";
import { 
  AlertCircle, 
  RefreshCw, 
  FileSpreadsheet, 
  FileText, 
  CheckCircle2, 
  DownloadCloud,
  FileBarChart2
} from "lucide-react";
import { Button } from "../../../components/ui/Button";
import { analyticsApi } from "../../../api/analyticsApi";

export function PnlDashboardTab({ 
  data, 
  isLoading, 
  isError, 
  error, 
  onRefetch,
  selectedBranch,
  startDate,
  endDate
}) {
  const [exportingXlsx, setExportingXlsx] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [exportStatus, setExportStatus] = useState(null);

  const handleExport = async (format) => {
    if (format === "xlsx") setExportingXlsx(true);
    else setExportingPdf(true);
    setExportStatus(null);

    try {
      const res = await analyticsApi.exportReport(
        "pnl",
        format,
        selectedBranch?.id,
        startDate,
        endDate
      );
      setExportStatus({
        type: "success",
        message: `Đã tải về thành công báo cáo ${format.toUpperCase()}: ${res.filename}`
      });
      setTimeout(() => setExportStatus(null), 5000);
    } catch (err) {
      setExportStatus({
        type: "error",
        message: err?.response?.data?.message || err?.message || "Đã xảy ra lỗi khi tạo báo cáo từ máy chủ."
      });
    } finally {
      if (format === "xlsx") setExportingXlsx(false);
      else setExportingPdf(false);
    }
  };

  if (isError) {
    return (
      <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-center space-y-3">
        <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
        <h3 className="text-sm font-bold text-rose-900">
          Không thể tải dữ liệu báo cáo Lãi/Lỗ P&L
        </h3>
        <p className="text-xs text-rose-700 max-w-md mx-auto">
          {error?.message || "Đã xảy ra lỗi khi kết nối với máy chủ phân tích tài chính."}
        </p>
        <button
          onClick={onRefetch}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700 transition-colors cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Thử lại
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Quick Export Action Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-pink-50 text-pink-600 flex items-center justify-center shrink-0">
            <FileBarChart2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-slate-900 uppercase tracking-wider">
                Báo cáo Lãi/Lỗ Thực tế (Realized P&L)
              </span>
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                Tier 1 & Tier 2
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Kỳ: <span className="font-semibold text-slate-700">{startDate}</span> đến <span className="font-semibold text-slate-700">{endDate}</span> • Chi nhánh: <span className="font-semibold text-slate-700">{selectedBranch?.name || "Tất cả chi nhánh"}</span>
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

      {/* Export Status Banner */}
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
            onClick={() => setExportStatus(null)}
            className="text-slate-400 hover:text-slate-600 font-bold ml-2 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Tier 1 & Tier 2 KPI Cards */}
      <PnlSummaryCards data={data} isLoading={isLoading} />

      {/* Interactive Trend Chart */}
      <PnlTrendChart dailySeries={data?.dailySeries} isLoading={isLoading} />

      {/* Per-Order Breakdown Table */}
      <OrderPnlTable orders={data?.orders} isLoading={isLoading} />
    </div>
  );
}
