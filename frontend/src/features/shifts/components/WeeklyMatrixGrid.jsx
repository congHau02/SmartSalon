import React from "react";
import { User, Users } from "lucide-react";
import { RosterCell } from "./RosterCell";
import { VI_DAYS_OF_WEEK, formatDateVi } from "../shifts.constants";

export function WeeklyMatrixGrid({ rosterData, templates, onUpdateCell }) {
  if (!rosterData || !rosterData.staff || rosterData.staff.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center shadow-xs">
        <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <h3 className="text-base font-bold text-slate-700">Chưa có nhân sự</h3>
        <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
          Chi nhánh này chưa có tài khoản Stylist hoặc Nhân viên nào đang hoạt động để phân ca trực.
        </p>
      </div>
    );
  }

  const todayStr = new Date().toISOString().split("T")[0];
  const sampleCells = rosterData.staff[0]?.schedules || [];

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[900px]">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-600 text-xs font-bold">
              <th className="py-3.5 px-4 w-56 sticky left-0 bg-slate-50/95 z-10 border-r border-slate-200">
                Nhân sự / Kỹ thuật viên
              </th>
              {sampleCells.map((cell, idx) => {
                const isToday = cell.date === todayStr;
                return (
                  <th
                    key={cell.date}
                    className={`py-3 px-3 text-center min-w-[130px] border-r border-slate-200/60 last:border-r-0 ${
                      isToday ? "bg-pink-50/80 text-pink-700 font-extrabold" : ""
                    }`}
                  >
                    <div className="text-[11px] uppercase tracking-wider opacity-75">
                      {VI_DAYS_OF_WEEK[idx]}
                    </div>
                    <div className="text-xs font-bold mt-0.5">
                      {formatDateVi(cell.date)}
                    </div>
                    {isToday && (
                      <span className="inline-block mt-1 px-1.5 py-0.2 rounded-full bg-pink-600 text-white text-[9px] font-bold">
                        Hôm nay
                      </span>
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rosterData.staff.map((staff) => (
              <tr key={staff.userId} className="hover:bg-slate-50/50 transition-colors">
                {/* Staff column (Sticky left) */}
                <td className="py-3.5 px-4 sticky left-0 bg-white/95 z-10 border-r border-slate-200 shadow-xs">
                  <div className="flex items-center gap-2.5">
                    {staff.avatarUrl ? (
                      <img
                        src={staff.avatarUrl}
                        alt={staff.fullName}
                        className="w-9 h-9 rounded-xl object-cover border border-slate-200 shrink-0"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-xl bg-pink-100 text-pink-700 flex items-center justify-center font-bold text-xs shrink-0">
                        {staff.fullName ? staff.fullName.charAt(0) : "S"}
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-800 truncate">
                        {staff.fullName}
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                            staff.role === "STYLIST"
                              ? "bg-purple-100 text-purple-700"
                              : "bg-blue-100 text-blue-700"
                          }`}
                        >
                          {staff.role === "STYLIST" ? "Stylist" : "Lễ tân"}
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono">
                          @{staff.username}
                        </span>
                      </div>
                    </div>
                  </div>
                </td>

                {/* 7 Schedule Cells */}
                {staff.schedules.map((cell) => (
                  <td
                    key={cell.date}
                    className="p-2 border-r border-slate-100 last:border-r-0 align-top"
                  >
                    <RosterCell
                      cell={cell}
                      templates={templates}
                      onUpdateCell={(targetStatus, templateId) =>
                        onUpdateCell(staff.userId, cell.date, targetStatus, templateId, cell.notes)
                      }
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
