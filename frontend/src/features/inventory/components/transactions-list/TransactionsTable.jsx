import React from "react";
import { History, User } from "lucide-react";
import { TRANSACTION_TYPE_CONFIG } from "../../constants";
import { formatDate } from "../../../../lib/utils";

export function TransactionsTable({ filteredTransactions, totalCount }) {
  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <th scope="col" className="py-3.5 px-4 sm:px-6">Thời gian & Mã GD</th>
              <th scope="col" className="py-3.5 px-4">Mặt hàng</th>
              <th scope="col" className="py-3.5 px-4">Loại biến động</th>
              <th scope="col" className="py-3.5 px-4">Biến động kiện (Seal)</th>
              <th scope="col" className="py-3.5 px-4">Biến động dung tích</th>
              <th scope="col" className="py-3.5 px-4">Tồn sau GD</th>
              <th scope="col" className="py-3.5 px-4 sm:px-6">Ghi chú / Căn cứ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {filteredTransactions.map((tx) => {
              const typeConfig = TRANSACTION_TYPE_CONFIG[tx.transactionType] || {
                label: tx.transactionType,
                badgeClass: "bg-slate-100 text-slate-700 border-slate-200",
              };

              const qtyDelta = tx.quantityUnits ?? 0;
              const volDelta = Number(tx.volumeAmount) || 0;

              return (
                <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-4 px-4 sm:px-6">
                    <div className="space-y-0.5">
                      <div className="font-semibold text-slate-800">{formatDate(tx.createdAt)}</div>
                      <div className="font-mono text-[10px] text-slate-400">Mã GD: #{tx.id}</div>
                    </div>
                  </td>

                  <td className="py-4 px-4">
                    <div className="space-y-0.5">
                      <div className="font-bold text-slate-900">{tx.productName}</div>
                      <span className="inline-block font-mono text-[10px] bg-slate-100 px-1.5 py-0.5 rounded-sm text-slate-600 border border-slate-200">
                        {tx.productSku}
                      </span>
                    </div>
                  </td>

                  <td className="py-4 px-4">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold border ${typeConfig.badgeClass}`}
                    >
                      {typeConfig.icon ? (
                        <typeConfig.icon className="w-3.5 h-3.5" aria-hidden="true" />
                      ) : (
                        <History className="w-3.5 h-3.5" aria-hidden="true" />
                      )}
                      <span>{typeConfig.label}</span>
                    </span>
                  </td>

                  <td className="py-4 px-4">
                    {qtyDelta !== 0 ? (
                      <span
                        className={`font-black text-xs ${
                          qtyDelta > 0 ? "text-emerald-600" : "text-purple-600"
                        }`}
                      >
                        {qtyDelta > 0 ? `+${qtyDelta}` : qtyDelta} kiện
                      </span>
                    ) : (
                      <span className="text-slate-400 text-xs">-</span>
                    )}
                  </td>

                  <td className="py-4 px-4">
                    {volDelta !== 0 ? (
                      <span
                        className={`font-black text-xs ${
                          volDelta > 0 ? "text-emerald-600" : "text-rose-600"
                        }`}
                      >
                        {volDelta > 0 ? `+${volDelta}` : volDelta} {tx.unit}
                      </span>
                    ) : (
                      <span className="text-slate-400 text-xs">0 {tx.unit}</span>
                    )}
                  </td>

                  <td className="py-4 px-4">
                    <span className="font-extrabold text-slate-800">
                      {Number(tx.balanceAfterVolume).toLocaleString("vi-VN")} {tx.unit}
                    </span>
                  </td>

                  <td className="py-4 px-4 sm:px-6">
                    <div className="space-y-1">
                      <div className="text-slate-700 max-w-xs truncate" title={tx.notes}>
                        {tx.notes || "Giao dịch hệ thống tự động"}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-slate-400">
                        {tx.createdBy && (
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3 text-slate-400" aria-hidden="true" />
                            {tx.createdBy}
                          </span>
                        )}
                        {tx.referenceOrderId && (
                          <span className="font-mono bg-purple-50 text-purple-700 px-1 rounded-sm border border-purple-200">
                            Đơn #{tx.referenceOrderId}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="p-4 bg-slate-50/60 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <span>
          Hiển thị <strong>{filteredTransactions.length}</strong> trên tổng số{" "}
          <strong>{totalCount}</strong> phát sinh ghi nhận
        </span>
        <span className="text-slate-400">
          Nhật ký bất biến (Immutable Audit Trail) phục vụ đối soát
        </span>
      </div>
    </>
  );
}
