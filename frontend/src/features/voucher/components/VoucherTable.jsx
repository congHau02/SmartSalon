import React from "react";
import { Edit2, CheckCircle2, XCircle, Globe, Building } from "lucide-react";
import { formatCurrency } from "../../../lib/utils";

export function VoucherTable({
  vouchers = [],
  isAdmin = false,
  onEdit,
  onToggleActive,
  isToggling = false,
}) {
  if (vouchers.length === 0) {
    return (
      <div className="py-12 text-center text-slate-400 bg-white border border-slate-200 rounded-2xl">
        <p className="text-sm font-medium">Chưa có mã giảm giá nào phù hợp</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[11px] font-bold border-b border-slate-200">
            <tr>
              <th className="py-3 px-4">Mã & Chương trình</th>
              <th className="py-3 px-4">Mức giảm</th>
              <th className="py-3 px-4">Điều kiện & Lượt dùng</th>
              <th className="py-3 px-4">Phạm vi áp dụng</th>
              <th className="py-3 px-4 text-center">Trạng thái</th>
              {isAdmin && <th className="py-3 px-4 text-right">Thao tác</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
            {vouchers.map((v) => {
              const isPercent = v.type === "PERCENT";
              const usageText = v.usageLimit ? `${v.usedCount} / ${v.usageLimit}` : `${v.usedCount} (Vô hạn)`;
              return (
                <tr key={v.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="flex flex-col gap-0.5">
                      <span className="font-mono font-bold text-sm text-pink-600 bg-pink-50 px-2 py-0.5 rounded-lg border border-pink-200/60 w-fit">
                        {v.code}
                      </span>
                      {v.name && <span className="font-semibold text-slate-900 text-xs mt-1">{v.name}</span>}
                      {v.description && <span className="text-[11px] text-slate-400">{v.description}</span>}
                    </div>
                  </td>

                  <td className="py-3.5 px-4 font-mono">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-slate-900">
                        {isPercent ? `${v.value}%` : formatCurrency(v.value)}
                      </span>
                      {isPercent && v.maxDiscount && (
                        <span className="text-[11px] text-slate-400">
                          Tối đa {formatCurrency(v.maxDiscount)}
                        </span>
                      )}
                    </div>
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="flex flex-col gap-0.5 text-[11px]">
                      <span>Đơn tối thiểu: <strong className="font-mono">{formatCurrency(v.minOrderAmount || 0)}</strong></span>
                      <span>Đã dùng: <strong className="font-mono">{usageText}</strong></span>
                      <span>Mỗi khách: <strong className="font-mono">{v.perCustomerLimit || 1}</strong> lần</span>
                    </div>
                  </td>

                  <td className="py-3.5 px-4">
                    {v.chainWide || !v.branchIds || v.branchIds.length === 0 ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200/60 text-[11px] font-semibold">
                        <Globe className="w-3 h-3" /> Toàn chuỗi
                      </span>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {v.branchNames && v.branchNames.length > 0 ? (
                          v.branchNames.map((bName, idx) => (
                            <span key={idx} className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px]">
                              <Building className="w-2.5 h-2.5" /> {bName}
                            </span>
                          ))
                        ) : (
                          <span className="text-slate-400 text-[11px]">{v.branchIds.length} chi nhánh</span>
                        )}
                      </div>
                    )}
                  </td>

                  <td className="py-3.5 px-4 text-center">
                    <button
                      type="button"
                      disabled={!isAdmin || isToggling}
                      onClick={() => onToggleActive(v.id, !v.active)}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold cursor-pointer transition-colors ${
                        v.active
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                          : "bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-200"
                      } ${!isAdmin ? "cursor-default" : ""}`}
                    >
                      {v.active ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" /> Đang chạy
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3.5 h-3.5" /> Tạm dừng
                        </>
                      )}
                    </button>
                  </td>

                  {isAdmin && (
                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => onEdit(v)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                        title="Chỉnh sửa mã voucher"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
