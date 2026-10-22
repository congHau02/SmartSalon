import React, { useState } from "react";
import { CheckCircle2, AlertCircle, ShieldCheck } from "lucide-react";
import { analyticsApi } from "../../../api/analyticsApi";
import { DownloadCenterBanner } from "./DownloadCenterBanner";
import { DownloadReportCards } from "./DownloadReportCards";
import { DownloadHistoryTable } from "./DownloadHistoryTable";

export function DownloadCenterTab({
  selectedBranch,
  startDate,
  endDate,
}) {
  const [downloading, setDownloading] = useState({
    "pnl-xlsx": false,
    "pnl-pdf": false,
    "staff-xlsx": false,
    "staff-pdf": false,
  });

  const [downloadHistory, setDownloadHistory] = useState([]);
  const [toastMessage, setToastMessage] = useState(null);

  const handleExport = async (reportType, format) => {
    const key = `${reportType === "staff-payroll" ? "staff" : reportType}-${format}`;
    setDownloading((prev) => ({ ...prev, [key]: true }));

    try {
      const result = await analyticsApi.exportReport(
        reportType,
        format,
        selectedBranch?.id,
        startDate,
        endDate
      );

      const newHistoryItem = {
        id: Date.now().toString(),
        title: reportType === "pnl" ? "Báo cáo Lãi / Lỗ Thực tế" : "Bảng Lương & Hoa hồng Nhân sự",
        filename: result.filename,
        format: format,
        reportType: reportType,
        size: result.size ? `${(result.size / 1024).toFixed(1)} KB` : "Đã tải về",
        timestamp: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
        status: "COMPLETED"
      };

      setDownloadHistory((prev) => [newHistoryItem, ...prev.slice(0, 7)]);
      setToastMessage({
        type: "success",
        text: `Đã xuất thành công tệp: ${result.filename}`
      });
      setTimeout(() => setToastMessage(null), 5000);
    } catch (err) {
      console.error("Export error:", err);
      setToastMessage({
        type: "error",
        text: err.message || "Không thể tải báo cáo. Vui lòng thử lại sau."
      });
      setTimeout(() => setToastMessage(null), 5000);
    } finally {
      setDownloading((prev) => ({ ...prev, [key]: false }));
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className={`p-4 rounded-2xl border flex items-center justify-between shadow-md transition-all ${
            toastMessage.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-900"
              : "bg-rose-50 border-rose-200 text-rose-900"
          }`}
        >
          <div className="flex items-center gap-2.5">
            {toastMessage.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            )}
            <span className="text-xs sm:text-sm font-semibold">{toastMessage.text}</span>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="text-xs font-bold text-slate-500 hover:text-slate-800 ml-4 cursor-pointer"
          >
            Đóng
          </button>
        </div>
      )}

      <DownloadCenterBanner
        selectedBranch={selectedBranch}
        startDate={startDate}
        endDate={endDate}
      />

      <DownloadReportCards
        downloading={downloading}
        onExport={handleExport}
      />

      <DownloadHistoryTable
        downloadHistory={downloadHistory}
        onReExport={handleExport}
      />

      {/* Accounting & Regulatory Compliance Note */}
      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-start gap-3 text-xs text-slate-600">
        <ShieldCheck className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <strong className="text-slate-900 font-bold block">
            Tiêu chuẩn đối soát kế toán & Định dạng dữ liệu:
          </strong>
          <p>
            Các tệp Excel (.xlsx) được xuất theo cấu trúc OOXML tiêu chuẩn với ô tiền tệ định dạng <code>#,##0 ₫</code> hỗ trợ công thức tự động; Tệp PDF (.pdf) được nhúng phông chữ <strong>Roboto / Arial Unicode TrueType</strong> đảm bảo thể hiện toàn bộ ký tự tiếng Việt có dấu sắc nét, chuẩn khổ A4 ngang và dọc theo quy định chứng từ nội bộ của Salon.
          </p>
        </div>
      </div>
    </div>
  );
}
