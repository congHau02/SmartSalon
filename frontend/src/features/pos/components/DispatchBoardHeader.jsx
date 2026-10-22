import React from "react";
import {
  MapPin,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  Clock,
  RotateCw,
  Coins,
  Plus,
} from "lucide-react";

export function DispatchBoardHeader({
  branchContext,
  dateControl,
  viewMode,
  onViewModeChange,
  actions,
  // Graceful fallbacks for legacy prop shape
  canSwitchBranch = branchContext?.canSwitch,
  branches = branchContext?.branches || [],
  selectedBranchId = branchContext?.selectedId,
  setSelectedBranchId = branchContext?.onChange,
  selectedBranch = branchContext?.current,
  selectedDate = dateControl?.date,
  setSelectedDate = dateControl?.onChange,
  handlePrevDay = dateControl?.onPrev,
  handleNextDay = dateControl?.onNext,
  handleToday = dateControl?.onToday,
  setViewMode = onViewModeChange,
  refetch = actions?.onRefresh,
  isRefetching = actions?.isRefreshing,
  onOpenCommissionLedger = actions?.onOpenCommissionLedger,
  onOpenWalkIn = actions?.onOpenWalkIn,
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-800/80 p-4 rounded-2xl border border-slate-700/70 shadow-sm backdrop-blur-sm">
      {/* Branch Context & Date Controls */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Branch Picker */}
        {canSwitchBranch ? (
          <div className="flex items-center gap-1.5 bg-slate-900/80 px-3 py-1.5 rounded-xl border border-slate-700">
            <MapPin className="w-4 h-4 text-pink-400 shrink-0" />
            <select
              value={selectedBranchId || ""}
              onChange={(e) => setSelectedBranchId(Number(e.target.value))}
              className="bg-transparent text-xs font-semibold text-slate-100 focus:outline-none cursor-pointer"
            >
              {branches.map((b) => (
                <option key={b.id} value={b.id} className="bg-slate-800 text-white">
                  {b.name}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 bg-slate-900/80 px-3 py-1.5 rounded-xl border border-slate-700 text-xs font-semibold text-slate-200">
            <MapPin className="w-4 h-4 text-pink-400" />
            <span>{selectedBranch?.name || "Chi nhánh hiện tại"}</span>
          </div>
        )}

        {/* Date Picker Navigation */}
        <div className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-xl border border-slate-700">
          <button
            onClick={handlePrevDay}
            aria-label="Ngày trước"
            title="Hôm trước"
            className="w-11 h-11 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-transparent text-xs font-mono font-semibold text-white px-2 py-1 focus:outline-none cursor-pointer"
          />
          <button
            onClick={handleNextDay}
            aria-label="Ngày sau"
            title="Hôm sau"
            className="w-11 h-11 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={handleToday}
            className="px-2 py-1 text-[11px] font-semibold text-pink-400 hover:text-pink-300 hover:bg-pink-500/10 rounded-md transition-colors cursor-pointer"
          >
            Hôm nay
          </button>
        </div>
      </div>

      {/* View Switcher & Action Buttons */}
      <div className="flex items-center gap-3">
        {/* View Toggle */}
        <div className="flex items-center bg-slate-900/80 p-1 rounded-xl border border-slate-700">
          <button
            onClick={() => setViewMode("kanban")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              viewMode === "kanban"
                ? "bg-slate-800 text-pink-400 shadow-sm border border-slate-650"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Kanban</span>
          </button>
          <button
            onClick={() => setViewMode("timeline")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              viewMode === "timeline"
                ? "bg-slate-800 text-pink-400 shadow-sm border border-slate-650"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Timeline</span>
          </button>
        </div>

        {/* Refresh Button */}
        <button
          onClick={() => refetch()}
          disabled={isRefetching}
          aria-label="Làm mới bảng điều phối"
          title="Làm mới bảng điều phối"
          className="w-11 h-11 flex items-center justify-center rounded-xl bg-slate-900/80 border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <RotateCw className={`w-4 h-4 ${isRefetching ? "animate-spin text-pink-400" : ""}`} />
        </button>

        {/* Commission Ledger Button */}
        <button
          onClick={onOpenCommissionLedger}
          title="Mở Sổ cái hoa hồng kỹ thuật viên"
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900/80 border border-amber-500/30 text-amber-300 hover:text-white hover:bg-amber-500/20 font-bold text-xs transition-colors cursor-pointer"
        >
          <Coins className="w-4 h-4 text-amber-400" />
          <span className="hidden sm:inline">Sổ cái Hoa hồng</span>
        </button>

        {/* Walk-In Order Button */}
        <button
          onClick={onOpenWalkIn}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-pink-600 to-pink-500 hover:from-pink-500 hover:to-pink-400 text-white font-bold text-xs shadow-lg shadow-pink-600/25 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Khách vãng lai (Walk-in)</span>
        </button>
      </div>
    </div>
  );
}
