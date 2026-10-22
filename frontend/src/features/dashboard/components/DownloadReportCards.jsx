import React from "react";
import { TrendingUp, Users, CheckCircle2, RefreshCw, FileSpreadsheet, FileText } from "lucide-react";
import { Button } from "../../../components/ui/Button";

export function DownloadReportCards({ downloading, onExport }) {
  return (
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

        <div className="pt-6 mt-4 border-t border-slate-100 grid grid-cols-2 gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => onExport("pnl", "xlsx")}
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
            onClick={() => onExport("pnl", "pdf")}
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

        <div className="pt-6 mt-4 border-t border-slate-100 grid grid-cols-2 gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => onExport("staff-payroll", "xlsx")}
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
            onClick={() => onExport("staff-payroll", "pdf")}
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
  );
}
