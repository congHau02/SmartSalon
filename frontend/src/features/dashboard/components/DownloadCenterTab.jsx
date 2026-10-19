import React, { useState } from "react";
import { 
  DownloadCloud, 
  FileSpreadsheet, 
  FileText, 
  CheckCircle2, 
  Clock, 
  Calendar, 
  Building2, 
  Layers, 
  AlertCircle, 
  RefreshCw, 
  ShieldCheck, 
  ChevronRight,
  TrendingUp,
  Users,
  AlertTriangle,
  ArrowDownToLine,
  FileCheck2
} from "lucide-react";
import { analyticsApi } from "../../../api/analyticsApi";
import { formatDate } from "../../../lib/utils";
import { Button } from "../../../components/ui/Button";
import { Badge } from "../../../components/ui/Badge";

export function DownloadCenterTab({
  selectedBranch,
  startDate,
  endDate,
  datePreset,
  onNavigateTab
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

      {/* Hero Banner: Download Center Overview */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-md relative overflow-hidden border border-slate-800">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/30 text-xs font-bold uppercase tracking-wider">
              <DownloadCloud className="w-3.5 h-3.5" /> Trung tâm Tải & Xuất Báo cáo Server-Side
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              Xuất Báo cáo Tài chính & Bảng Lương Đa Định dạng
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Tạo và tải các tài liệu đối soát kế toán đạt chuẩn doanh nghiệp: Bảng tính Excel (.xlsx) đa trang (multi-sheet) với định dạng tiền tệ VND tự động và tài liệu PDF khổ A4 nhúng phông chữ tiếng Việt Unicode hỗ trợ in ấn và ký duyệt 3 bên.
            </p>
          </div>

          {/* Current Parameter Pill */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/15 space-y-2 shrink-0">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Tham số đang áp dụng
            </span>
            <div className="flex items-center gap-2 text-xs font-medium text-slate-200">
              <Building2 className="w-4 h-4 text-pink-400" />
              <span>{selectedBranch?.name || "Tất cả chi nhánh"}</span>
            </div>
            <div className="flex items-center gap-2 text-xs font-medium text-slate-200">
              <Calendar className="w-4 h-4 text-emerald-400" />
              <span>{startDate} → {endDate}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2 Main Export Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card 1: Báo cáo Lãi/Lỗ Thực tế (Realized P&L) */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-xs">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div className="flex flex-wrap gap-1.5 justify-end">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-blue-50 text-blue-700 border border-blue-200/60">
                  Tài chính & Thuế
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-100 text-slate-700">
                  2 Cấp Lợi Nhuận
                </span>
              </div>
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                Báo cáo Lãi / Lỗ Thực tế (Realized P&L Statement)
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Đối soát chi tiết doanh thu dịch vụ & bán lẻ thuần sau chiết khấu, giá vốn hóa chất tiêu hao (Chemical COGS) theo ml/g, hoa hồng kỹ thuật viên và 2 cấp lợi nhuận ròng (Cấp 1: Vận hành đơn hàng; Cấp 2: Sau khấu trừ lương cứng).
              </p>
            </div>

            {/* Included Content Features */}
            <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
              <div className="flex items-center gap-2 text-slate-700">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span>
                  <strong>Sheet 1: Tong_Hop_Ket_Qua_Kinh_Doanh</strong> — Chỉ số tổng hợp & Chuỗi xu hướng ngày
                </span>
              </div>
              <div className="flex items-center gap-2 text-slate-700">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span>
                  <strong>Sheet 2: Chi_Tiet_Lai_Lo_Tung_Ca</strong> — Bảng kê chi tiết P&L từng đơn hàng
                </span>
              </div>
              <div className="flex items-center gap-2 text-slate-700">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span>
                  <strong>Bản in PDF A4</strong> — Phông chữ tiếng Việt chuẩn, hộp thẻ tổng quan & chữ ký 3 bên
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-6 mt-4 border-t border-slate-100 grid grid-cols-2 gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleExport("pnl", "xlsx")}
              disabled={downloading["pnl-xlsx"]}
              className="text-xs font-bold gap-2 text-emerald-700 border-emerald-200 hover:bg-emerald-50 hover:text-emerald-800 h-11"
            >
              {downloading["pnl-xlsx"] ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-emerald-600" />
                  <span>Đang xuất...</span>
                </>
              ) : (
                <>
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  <span>Xuất Excel (.xlsx)</span>
                </>
              )}
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={() => handleExport("pnl", "pdf")}
              disabled={downloading["pnl-pdf"]}
              className="text-xs font-bold gap-2 text-rose-700 border-rose-200 hover:bg-rose-50 hover:text-rose-800 h-11"
            >
              {downloading["pnl-pdf"] ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-rose-600" />
                  <span>Đang xuất...</span>
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4 text-rose-600" />
                  <span>Xuất PDF (.pdf)</span>
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Card 2: Bảng Lương & Hoa hồng Nhân sự (Staff Performance & Payroll) */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="w-12 h-12 rounded-2xl bg-pink-50 text-pink-600 flex items-center justify-center shadow-xs">
                <Users className="w-6 h-6" />
              </div>
              <div className="flex flex-wrap gap-1.5 justify-end">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-pink-50 text-pink-700 border border-pink-200/60">
                  Lương & Thưởng
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-100 text-slate-700">
                  Chữ Ký 3 Bên
                </span>
              </div>
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                Bảng Lương & Hiệu suất Nhân sự (Staff Payroll & KPI)
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Bảng tổng hợp chi trả lương cứng (Base Salary), hoa hồng lũy kế từ Commission Ledger từng ca làm việc, thực lĩnh và 2 chỉ số gắn bó: Tỷ lệ khách chọn stylist đích danh và Tỷ lệ khách quen quay lại (Re-booking Rate).
              </p>
            </div>

            {/* Included Content Features */}
            <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
              <div className="flex items-center gap-2 text-slate-700">
                <CheckCircle2 className="w-3.5 h-3.5 text-pink-600 shrink-0" />
                <span>
                  <strong>Sheet 1: Tong_Hop_Bang_Luong_KPI</strong> — Lương cứng, số bước & chỉ số KPI nhân sự
                </span>
              </div>
              <div className="flex items-center gap-2 text-slate-700">
                <CheckCircle2 className="w-3.5 h-3.5 text-pink-600 shrink-0" />
                <span>
                  <strong>Sheet 2: Chi_Tiet_Hoa_Hong_Tung_Ca</strong> — Bảng kê chi tiết từng giao dịch hoa hồng
                </span>
              </div>
              <div className="flex items-center gap-2 text-slate-700">
                <CheckCircle2 className="w-3.5 h-3.5 text-pink-600 shrink-0" />
                <span>
                  <strong>Bản in PDF A4</strong> — Bảng kê chữ ký 3 bên: Người lập biểu, Kế toán trưởng, Chủ Salon
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-6 mt-4 border-t border-slate-100 grid grid-cols-2 gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleExport("staff-payroll", "xlsx")}
              disabled={downloading["staff-xlsx"]}
              className="text-xs font-bold gap-2 text-emerald-700 border-emerald-200 hover:bg-emerald-50 hover:text-emerald-800 h-11"
            >
              {downloading["staff-xlsx"] ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-emerald-600" />
                  <span>Đang xuất...</span>
                </>
              ) : (
                <>
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  <span>Xuất Excel (.xlsx)</span>
                </>
              )}
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={() => handleExport("staff-payroll", "pdf")}
              disabled={downloading["staff-pdf"]}
              className="text-xs font-bold gap-2 text-rose-700 border-rose-200 hover:bg-rose-50 hover:text-rose-800 h-11"
            >
              {downloading["staff-pdf"] ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-rose-600" />
                  <span>Đang xuất...</span>
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4 text-rose-600" />
                  <span>Xuất PDF (.pdf)</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Recent Export Log / Download History Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Nhật ký Tải về Gần đây (Recent Export Activity)
              </h3>
              <p className="text-[11px] text-slate-400">
                Lịch sử các tệp tài liệu đã được máy chủ xử lý và tải xuống trong phiên làm việc
              </p>
            </div>
          </div>
          <span className="text-xs font-medium text-slate-500">
            {downloadHistory.length} tệp tài liệu
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-500 font-bold uppercase text-[10px]">
              <tr>
                <th className="py-3 px-4">Loại báo cáo</th>
                <th className="py-3 px-4">Tên tệp tin</th>
                <th className="py-3 px-4 text-center">Định dạng</th>
                <th className="py-3 px-4 text-center">Kích thước</th>
                <th className="py-3 px-4 text-center">Thời gian</th>
                <th className="py-3 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {downloadHistory.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 px-4 text-center text-slate-400 font-medium">
                    Chưa có tệp nào được xuất trong phiên làm việc này.
                  </td>
                </tr>
              )}
              {downloadHistory.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-4 font-semibold text-slate-900">
                    <div className="flex items-center gap-2">
                      {item.format === "xlsx" ? (
                        <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : (
                        <FileText className="w-4 h-4 text-rose-600 shrink-0" />
                      )}
                      <span>{item.title}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-slate-600 font-mono text-[11px]">
                    {item.filename}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      item.format === "xlsx"
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-rose-50 text-rose-700 border border-rose-200"
                    }`}>
                      .{item.format}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center text-slate-500">
                    {item.size || "18.5 KB"}
                  </td>
                  <td className="py-3 px-4 text-center text-slate-400">
                    {item.timestamp}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      type="button"
                      onClick={() => handleExport(item.reportType, item.format)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-slate-600 hover:text-pink-600 hover:bg-pink-50 font-semibold text-[11px] transition-colors cursor-pointer"
                    >
                      <ArrowDownToLine className="w-3.5 h-3.5" /> Tải lại
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

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
