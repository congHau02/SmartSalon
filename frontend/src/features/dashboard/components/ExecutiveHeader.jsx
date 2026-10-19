import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { axiosClient } from "../../../api/axiosClient";
import { 
  Building2, 
  Activity, 
  RefreshCw, 
  Calendar, 
  TrendingUp, 
  Users, 
  AlertTriangle,
  ChevronDown,
  DownloadCloud
} from "lucide-react";

export function ExecutiveHeader({
  selectedBranch,
  branches = [],
  onSelectBranch,
  canSwitchBranch = false,
  activeTab,
  onTabChange,
  datePreset,
  onPresetChange,
  startDate,
  endDate,
  onCustomDateChange
}) {
  const [showCustomRange, setShowCustomRange] = useState(datePreset === "custom");

  const { data: healthResponse, isFetching, refetch } = useQuery({
    queryKey: ["executive-system-health"],
    queryFn: () => axiosClient.get("/public/health"),
    refetchInterval: 30000,
  });

  const isUp = healthResponse?.result?.database === "UP" || healthResponse?.result?.service;

  const presets = [
    { id: "today", label: "Hôm nay" },
    { id: "7days", label: "7 ngày qua" },
    { id: "thisMonth", label: "Tháng này" },
    { id: "custom", label: "Tùy chọn ngày" },
  ];

  const tabs = [
    { id: "pnl", label: "Tổng quan & P&L Thực tế", icon: TrendingUp },
    { id: "staff", label: "Hiệu suất & Lương Nhân sự", icon: Users },
    { id: "inventory", label: "Cảnh báo Kho & Hao hụt BOM", icon: AlertTriangle },
    { id: "export", label: "Trung tâm Xuất Báo cáo", icon: DownloadCloud },
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 space-y-4">
      {/* Top Row: Title, Branch Badge & Compact Live Health Indicator */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Trung tâm Điều hành & Phân tích Tài chính
            </h1>
            <span className="px-2 py-0.5 text-[11px] font-bold uppercase rounded-full bg-pink-50 text-pink-700 border border-pink-200/60">
              Live Command Center
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Giám sát Lãi/Lỗ Realized P&L, Giá vốn hóa chất COGS, Hiệu suất nhân sự & Cảnh báo tồn kho
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Branch Context Selector / Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700">
            <Building2 className="w-4 h-4 text-pink-600" />
            <span>Chi nhánh:</span>
            {canSwitchBranch && branches.length > 0 ? (
              <span className="relative inline-flex items-center">
                <select
                  aria-label="Chọn chi nhánh"
                  value={selectedBranch?.id ?? ""}
                  onChange={(e) => onSelectBranch(Number(e.target.value))}
                  className="appearance-none bg-transparent pr-5 font-bold text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-500/40 rounded cursor-pointer"
                >
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-0 pointer-events-none" aria-hidden="true" />
              </span>
            ) : (
              <span className="font-bold text-slate-900">
                {selectedBranch?.name || "Chi nhánh Flagship"}
              </span>
            )}
          </div>

          {/* Compact Live Health Indicator */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-600">
            <span className="relative flex h-2.5 w-2.5">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                isUp ? "bg-emerald-400" : "bg-amber-400"
              }`} />
              <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                isUp ? "bg-emerald-500" : "bg-amber-500"
              }`} />
            </span>
            <span className="font-semibold text-slate-700">
              {isUp ? "Hệ thống Trực tuyến" : "Đang kết nối..."}
            </span>
            <button
              onClick={() => refetch()}
              disabled={isFetching}
              title="Làm mới trạng thái"
              className="text-slate-400 hover:text-pink-600 transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? "animate-spin text-pink-600" : ""}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Middle Row: Date Range Presets & Custom Picker */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-100">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-bold text-slate-400 mr-1 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" /> Kỳ báo cáo:
          </span>
          {presets.map((preset) => {
            const isActive = datePreset === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => {
                  onPresetChange(preset.id);
                  setShowCustomRange(preset.id === "custom");
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isActive
                    ? "bg-pink-600 text-white shadow-xs shadow-pink-600/30"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200/80 hover:text-slate-900"
                }`}
              >
                {preset.label}
              </button>
            );
          })}
        </div>

        {/* Custom Date Pickers */}
        {(showCustomRange || datePreset === "custom") && (
          <div className="flex items-center gap-2 text-xs">
            <input
              type="date"
              aria-label="Từ ngày"
              value={startDate}
              onChange={(e) => onCustomDateChange(e.target.value, endDate)}
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-pink-500/30"
            />
            <span className="text-slate-400 font-bold">→</span>
            <input
              type="date"
              aria-label="Đến ngày"
              value={endDate}
              onChange={(e) => onCustomDateChange(startDate, e.target.value)}
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-pink-500/30"
            />
          </div>
        )}
      </div>

      {/* Bottom Row: 3 Analytical Tabs Switcher */}
      <div className="flex border-b border-slate-200 overflow-x-auto gap-2 pt-1 scrollbar-none">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? "border-pink-600 text-pink-600 bg-pink-50/50 rounded-t-xl"
                  : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? "text-pink-600" : "text-slate-400"}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
