import React from "react";
import { Clock, FileSpreadsheet, FileText, ArrowDownToLine } from "lucide-react";

export function DownloadHistoryTable({ downloadHistory = [], onReExport }) {
  return (
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
                    onClick={() => onReExport(item.reportType, item.format)}
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
  );
}
