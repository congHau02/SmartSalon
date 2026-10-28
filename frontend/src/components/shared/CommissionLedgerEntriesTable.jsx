import React from "react";
import { CommissionLedgerRow } from "./CommissionLedgerRow";



export function CommissionLedgerEntriesTable({
  entries = [],
  showStaffColumn = false,
  variant = "dark",
}) {
  const isDark = variant === "dark";

  const tableContent = (
    <table
      className={
        isDark
          ? "w-full text-left text-xs text-slate-300"
          : "w-full text-left text-xs border-collapse"
      }
    >
      <thead
        className={
          isDark
            ? "bg-slate-950/80 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800"
            : "bg-slate-50/80 sticky top-0 z-10 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider"
        }
      >
        <tr>
          <th className={isDark ? "py-2.5 px-3" : "py-2.5 px-4"}>
            {isDark ? "Thời gian / Mã đơn" : "Mã đơn & Thời gian"}
          </th>
          {showStaffColumn && (
            <th className={isDark ? "py-2.5 px-3" : "py-2.5 px-4"}>Kỹ thuật viên</th>
          )}
          <th className={isDark ? "py-2.5 px-3" : "py-2.5 px-4"}>
            {isDark ? "Dịch vụ & Bước thực hiện" : "Dịch vụ / Công đoạn (Step)"}
          </th>
          <th className={isDark ? "py-2.5 px-3 text-right" : "py-2.5 px-4 text-center"}>
            {isDark ? "Tỷ lệ bước" : "Tỷ lệ %"}
          </th>
          {isDark && (
            <th className="py-2.5 px-3 text-right">Hoa hồng (VND)</th>
          )}
          <th className={isDark ? "py-2.5 px-3" : "py-2.5 px-4"}>
            {isDark ? "Công thức hạch toán" : "Công thức tính hoa hồng"}
          </th>
          <th className={isDark ? "py-2.5 px-3 text-center" : "py-2.5 px-4 text-center"}>
            Trạng thái
          </th>
          {!isDark && (
            <th className="py-2.5 px-4 text-right">Hoa hồng thực nhận</th>
          )}
        </tr>
      </thead>
      <tbody
        className={
          isDark
            ? "divide-y divide-slate-800/60"
            : "divide-y divide-slate-100 font-medium"
        }
      >
        {entries.map((entry) => (
          <CommissionLedgerRow key={entry.id} entry={entry} isDark={isDark} showStaffColumn={showStaffColumn} />
        ))}
      </tbody>
    </table>
  );

  return isDark ? (
    <div className="overflow-x-auto rounded-2xl border border-slate-800">
      {tableContent}
    </div>
  ) : (
    tableContent
  );
}
