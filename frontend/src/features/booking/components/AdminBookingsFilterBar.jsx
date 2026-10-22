import React from "react";
import { Search, RotateCcw } from "lucide-react";

export function AdminBookingsFilterBar({
  metrics = { total: 0, pending: 0, confirmed: 0, inProgress: 0, completed: 0 },
  branches = [],
  selectedBranchId,
  setSelectedBranchId,
  selectedStatus,
  setSelectedStatus,
  selectedDate,
  setSelectedDate,
  searchQuery,
  setSearchQuery,
  statusConfig = {},
  hasActiveFilters,
  onResetFilters,
}) {
  return (
    <div className="space-y-4">
      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <div className="text-xs font-semibold text-slate-500">Tổng lịch hẹn</div>
          <div className="text-2xl font-black text-slate-900 mt-1">{metrics.total}</div>
          <div className="text-xs text-slate-400 mt-0.5">Trong bộ lọc hiện tại</div>
        </div>

        <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200 shadow-2xs">
          <div className="text-xs font-semibold text-amber-700 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span>Giữ chỗ 5 phút</span>
          </div>
          <div className="text-2xl font-black text-amber-900 mt-1">{metrics.pending}</div>
          <div className="text-xs text-amber-600 mt-0.5">Chờ thanh toán cọc 20%</div>
        </div>

        <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200 shadow-2xs">
          <div className="text-xs font-semibold text-emerald-700 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Đã cọc & Xác nhận</span>
          </div>
          <div className="text-2xl font-black text-emerald-900 mt-1">{metrics.confirmed}</div>
          <div className="text-xs text-emerald-600 mt-0.5">Sẵn sàng tiếp đón</div>
        </div>

        <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-200 shadow-2xs">
          <div className="text-xs font-semibold text-indigo-700 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-indigo-500" />
            <span>Đang phục vụ / Check-in</span>
          </div>
          <div className="text-2xl font-black text-indigo-900 mt-1">{metrics.inProgress}</div>
          <div className="text-xs text-indigo-600 mt-0.5">Tại salon hiện tại</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 shadow-2xs">
          <div className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-slate-400" />
            <span>Hoàn thành / Kết thúc</span>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-1">{metrics.completed}</div>
          <div className="text-xs text-slate-400 mt-0.5">Đã thu đủ 100%</div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">Chi nhánh</label>
            <select
              value={selectedBranchId}
              onChange={(e) => setSelectedBranchId(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 bg-white"
            >
              <option value="">Tất cả chi nhánh</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">Trạng thái</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 bg-white"
            >
              <option value="">Tất cả trạng thái</option>
              {Object.entries(statusConfig).map(([key, config]) => (
                <option key={key} value={key}>
                  {config.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">Ngày hẹn</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">Tìm kiếm</label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Mã hẹn, tên, SĐT..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8.5 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 bg-white"
              />
            </div>
          </div>
        </div>

        {hasActiveFilters && (
          <div className="flex justify-end pt-1">
            <button
              type="button"
              onClick={onResetFilters}
              className="text-xs text-pink-600 hover:text-pink-700 font-bold flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Xóa bộ lọc</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
