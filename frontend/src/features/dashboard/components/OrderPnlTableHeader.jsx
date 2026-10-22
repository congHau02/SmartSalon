import React from "react";
import { Receipt, Search } from "lucide-react";

export function OrderPnlTableHeader({ searchTerm, setSearchTerm, count }) {
  return (
    <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div>
        <div className="flex items-center gap-2">
          <Receipt className="w-4 h-4 text-pink-600" />
          <h3 className="text-sm font-black text-slate-900 tracking-tight">
            Bảng Kê Chi Tiết Lãi/Lỗ Từng Đơn Hàng (Per-Order P&L)
          </h3>
        </div>
        <p className="text-xs text-slate-500 mt-0.5">
          Bóc tách Doanh thu thuần, Giá vốn hóa chất (Chemical COGS), Giá vốn bán lẻ, Hoa hồng & Lợi nhuận từng đơn
        </p>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm theo mã đơn, khách hàng..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-pink-500/20 w-56 sm:w-64"
          />
        </div>
        <span className="text-xs font-semibold text-slate-400">
          {count} đơn
        </span>
      </div>
    </div>
  );
}
