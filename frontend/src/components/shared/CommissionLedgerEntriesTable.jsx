import React from "react";
import { Calendar, Scissors, Layers, Calculator } from "lucide-react";
import { formatCurrency, formatDate } from "../../lib/utils";
import { Badge } from "../ui/Badge";

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
        {entries.map((entry) => {
          const isOt = Boolean(entry.isOvertime);

          return (
            <tr
              key={entry.id}
              className={
                isDark
                  ? "hover:bg-slate-800/30 transition-colors"
                  : "hover:bg-slate-50/60 transition-colors"
              }
            >
              <td className={isDark ? "py-2.5 px-3" : "py-3 px-4"}>
                {isDark ? (
                  <>
                    <div className="font-mono text-slate-400 text-[11px]">
                      {entry.createdAt
                        ? new Date(entry.createdAt).toLocaleTimeString("vi-VN", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "--:--"}
                    </div>
                    <div className="font-mono font-bold text-white text-xs">
                      {entry.orderCode || `#ORD-${entry.orderId}`}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="font-bold text-slate-900 font-mono">
                      {entry.orderCode || `#ORD-${entry.orderId}`}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-300" />
                      {formatDate(entry.createdAt)}
                    </div>
                  </>
                )}
              </td>
              {showStaffColumn && (
                <td
                  className={
                    isDark
                      ? "py-2.5 px-3 font-semibold text-white"
                      : "py-3 px-4 font-semibold text-slate-800"
                  }
                >
                  {entry.staffName}
                </td>
              )}
              <td className={isDark ? "py-2.5 px-3" : "py-3 px-4"}>
                {isDark ? (
                  <>
                    <div className="font-medium text-slate-200 flex items-center gap-1.5">
                      <span>{entry.serviceName || "Dịch vụ POS"}</span>
                      {isOt && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40">
                          OT 1.2x
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-pink-400 flex items-center gap-1">
                      <Scissors className="w-3 h-3" />
                      <span>{entry.stepName || "Công đoạn dịch vụ"}</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-pink-600 shrink-0" />
                      <span>{entry.stepName || "Công đoạn dịch vụ"}</span>
                      {isOt && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-amber-100 text-amber-800 border border-amber-300">
                          OT 1.2x
                        </span>
                      )}
                    </div>
                    {entry.serviceName && (
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {entry.serviceName}
                      </div>
                    )}
                  </>
                )}
              </td>
              <td
                className={
                  isDark
                    ? "py-2.5 px-3 text-right font-mono text-slate-400"
                    : "py-3 px-4 text-center font-mono text-slate-700"
                }
              >
                {entry.commissionRate != null
                  ? `${Number(entry.commissionRate)}%`
                  : isDark
                  ? "--"
                  : "—"}
              </td>
              {isDark && (
                <td className="py-2.5 px-3 text-right font-mono font-bold text-amber-400">
                  {formatCurrency(entry.amount)}
                </td>
              )}
              <td
                className={
                  isDark
                    ? "py-2.5 px-3 text-[11px] text-slate-400 font-mono max-w-xs truncate"
                    : "py-3 px-4 max-w-xs"
                }
                title={isDark ? entry.calculationNotes : undefined}
              >
                {isDark ? (
                  entry.calculationNotes || "--"
                ) : (
                  <div className="text-slate-600 text-[11px] font-mono bg-slate-50 px-2 py-1 rounded-lg border border-slate-200/60 inline-block">
                    <Calculator className="w-3 h-3 inline mr-1 text-slate-400" />
                    {entry.calculationNotes || "20% commission pool"}
                  </div>
                )}
              </td>
              <td className={isDark ? "py-2.5 px-3 text-center" : "py-3 px-4 text-center"}>
                {isDark ? (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    {entry.status || "EARNED"}
                  </span>
                ) : (
                  <Badge variant="success" className="text-[10px] uppercase font-bold">
                    {entry.status || "EARNED"}
                  </Badge>
                )}
              </td>
              {!isDark && (
                <td className="py-3 px-4 text-right">
                  <span className="font-black text-emerald-600 text-sm">
                    +{formatCurrency(entry.amount)}
                  </span>
                </td>
              )}
            </tr>
          );
        })}
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
