import React from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Copy,
  RefreshCw,
  Loader2,
  CalendarRange,
} from "lucide-react";
import { useShiftRoster } from "./useShiftRoster";
import { ShiftTemplatesCard } from "./components/ShiftTemplatesCard";
import { WeeklyMatrixGrid } from "./components/WeeklyMatrixGrid";
import { BookingConflictModal } from "./components/BookingConflictModal";
import { ShiftTemplateModal } from "./components/ShiftTemplateModal";
import { formatDateVi } from "./shifts.constants";

export function ShiftRosterPage() {
  const {
    branchId,
    selectedBranch,
    startDate,
    endDate,
    templates,
    rosterData,
    isLoading,
    isUpdating,
    isRosterFetching,
    conflictData,
    closeConflictModal,
    templateModalData,
    openTemplateModal,
    closeTemplateModal,
    goToNextWeek,
    goToPrevWeek,
    goToCurrentWeek,
    updateCell,
    copyWeek,
    saveTemplate,
    refetchRoster,
  } = useShiftRoster();

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <CalendarDays className="w-6 h-6 text-pink-600" />
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Lịch trực & Chấm công
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Phân công ma trận 7 ngày theo ca trực chi nhánh & bảo vệ xung đột lịch hẹn
            {selectedBranch && (
              <span className="font-semibold text-slate-700"> — {selectedBranch.name}</span>
            )}
          </p>
        </div>

        {/* Action Controls: Week Switcher & 1-Click Copy */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Week switcher */}
          <div className="flex items-center bg-white rounded-xl border border-slate-200/90 shadow-xs p-1">
            <button
              type="button"
              onClick={goToPrevWeek}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Tuần trước"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={goToCurrentWeek}
              className="px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 rounded-md transition-colors cursor-pointer"
            >
              Tuần này
            </button>
            <button
              type="button"
              onClick={goToNextWeek}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Tuần sau"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Current Date Range Badge */}
          <div className="hidden md:flex items-center gap-1.5 px-3 py-2 bg-white rounded-xl border border-slate-200 text-xs font-bold text-slate-700 shadow-xs">
            <CalendarRange className="w-3.5 h-3.5 text-pink-600" />
            <span>
              {formatDateVi(startDate)} – {formatDateVi(endDate)}
            </span>
          </div>

          {/* 1-Click Copy Week Button */}
          <button
            type="button"
            onClick={() => copyWeek()}
            disabled={isUpdating || isLoading}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-white bg-slate-800 hover:bg-slate-900 disabled:opacity-50 rounded-xl shadow-xs transition-all cursor-pointer"
            title="Sao chép toàn bộ phân ca của 7 ngày tuần trước sang tuần này"
          >
            {isUpdating ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Copy className="w-3.5 h-3.5 text-pink-400" />
            )}
            <span>Sao chép lịch tuần trước</span>
          </button>

          {/* Refresh */}
          <button
            type="button"
            onClick={() => refetchRoster()}
            className="w-9 h-9 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center text-slate-600 transition-colors cursor-pointer"
            title="Làm mới ma trận lịch"
          >
            <RefreshCw className={`w-4 h-4 ${isRosterFetching ? "animate-spin text-pink-600" : ""}`} />
          </button>
        </div>
      </div>

      {/* Top Card: Shift Templates */}
      <ShiftTemplatesCard
        templates={templates}
        onAddTemplate={() => openTemplateModal()}
        onEditTemplate={(tmpl) => openTemplateModal(tmpl)}
      />

      {/* Main Weekly Matrix Grid */}
      {isLoading ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-16 text-center shadow-xs">
          <Loader2 className="w-8 h-8 text-pink-600 animate-spin mx-auto mb-3" />
          <p className="text-xs font-semibold text-slate-600">Đang tải ma trận lịch trực tuần...</p>
        </div>
      ) : (
        <WeeklyMatrixGrid
          rosterData={rosterData}
          templates={templates}
          onUpdateCell={updateCell}
        />
      )}

      {/* Booking Conflict Guard Modal (HTTP 409) */}
      <BookingConflictModal
        isOpen={!!conflictData}
        data={conflictData}
        onClose={closeConflictModal}
      />

      {/* Shift Template Create/Edit Modal */}
      <ShiftTemplateModal
        isOpen={!!templateModalData}
        initialData={templateModalData}
        branchId={branchId}
        onSave={saveTemplate}
        onClose={closeTemplateModal}
      />
    </div>
  );
}
