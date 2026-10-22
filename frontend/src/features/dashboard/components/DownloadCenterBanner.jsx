import React from "react";
import { DownloadCloud, Building2, Calendar } from "lucide-react";

export function DownloadCenterBanner({ selectedBranch, startDate, endDate }) {
  return (
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
  );
}
