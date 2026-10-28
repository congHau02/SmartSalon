import React from "react";
import { ChevronLeft, ChevronRight, Plus, User } from "lucide-react";

export function WorklogControlsBar({
  selectedDate,
  setSelectedDate,
  handlePrevDay,
  handleNextDay,
  handleToday,
  isOnlyStylist,
  stylists = [],
  selectedStylistId,
  setSelectedStylistId,
  onOpenQuickTicket,
}) {
  return (
    <div className="p-3 bg-slate-850 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-wrap items-center gap-2">
        {/* Date navigation */}
        <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-700">
          <button
            onClick={handlePrevDay}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-transparent text-xs font-mono font-semibold text-white px-2 focus:outline-none cursor-pointer"
          />
          <button
            onClick={handleNextDay}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={handleToday}
            className="px-2 py-0.5 text-[11px] font-semibold text-pink-400 hover:text-pink-300 rounded cursor-pointer"
          >
            Hôm nay
          </button>
        </div>

        {/* Stylist Selector (only for Admin/Manager/Staff) */}
        {!isOnlyStylist && stylists.length > 0 && (
          <div className="flex items-center gap-1.5 bg-slate-900/90 px-3 py-1.5 rounded-xl border border-slate-700 text-xs">
            <User className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedStylistId}
              onChange={(e) => setSelectedStylistId(e.target.value)}
              className="bg-transparent text-white font-semibold focus:outline-none cursor-pointer"
            >
              {stylists.map((st) => (
                <option key={st.id} value={st.id} className="bg-slate-800 text-white">
                  {st.fullName || st.username}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Quick Ticket Button */}
      <button
        onClick={onOpenQuickTicket}
        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-pink-600 to-pink-500 hover:from-pink-500 hover:to-pink-400 text-white font-bold text-xs shadow-md shadow-pink-900/30 transition-all cursor-pointer"
      >
        <Plus className="w-4 h-4 stroke-[2.5]" />
        <span>Tạo phiếu cắt nhanh</span>
      </button>
    </div>
  );
}
