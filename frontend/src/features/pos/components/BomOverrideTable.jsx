import React from "react";
import { Plus, Trash2 } from "lucide-react";

export function BomOverrideTable({
  bomItems = [],
  onOpenAddChemical,
  onAmountChange,
  onRemoveItem,
}) {
  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-sm space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-pink-500" />
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
            Bảng tiêu hao hóa chất (ml / gram)
          </h4>
        </div>
        <button
          type="button"
          onClick={onOpenAddChemical}
          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-pink-500/10 text-pink-300 border border-pink-500/20 hover:bg-pink-500/20 transition cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Thêm hóa chất ngoài định mức</span>
        </button>
      </div>

      {bomItems.length === 0 ? (
        <div className="p-6 text-center border border-dashed border-slate-800 rounded-xl text-slate-400 text-xs">
          Chưa có hóa chất tiêu hao nào cho đơn này. Bấm "Thêm hóa chất ngoài định mức" để bổ sung.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/40">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-800/60 text-slate-400 font-semibold border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3">Hóa chất / Vật tư</th>
                <th className="py-2.5 px-3 text-right">Định mức chuẩn</th>
                <th className="py-2.5 px-3 text-right w-36">Thực tế sử dụng</th>
                <th className="py-2.5 px-3 text-center">ĐVT</th>
                <th className="py-2.5 px-3 text-center w-14">Xóa</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {bomItems.map((item, idx) => {
                const isOverridden =
                  item.standardAmount > 0 && item.actualAmount !== item.standardAmount;
                return (
                  <tr
                    key={`${item.productId}-${idx}`}
                    className="hover:bg-slate-900/50 transition-colors"
                  >
                    <td className="py-2.5 px-3 font-medium text-white">
                      <div className="flex flex-col">
                        <span>{item.productName}</span>
                        {item.productSku && (
                          <span className="text-[10px] text-slate-400 font-mono">
                            {item.productSku}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-300 font-mono">
                      {item.standardAmount > 0 ? (
                        <span>
                          {item.standardAmount} {item.unit}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">Ngoài định mức</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <div className="inline-flex items-center justify-end gap-1.5">
                        <input
                          type="number"
                          min="0"
                          step="0.5"
                          value={item.actualAmount}
                          onChange={(e) => onAmountChange(idx, e.target.value)}
                          className={`w-24 text-right px-2 py-1 rounded-lg text-xs font-mono font-bold focus:outline-none transition-colors ${
                            isOverridden
                              ? "bg-amber-500/10 border border-amber-500/50 text-amber-300 focus:border-amber-400"
                              : "bg-slate-800 border border-slate-700 text-white focus:border-pink-500"
                          }`}
                        />
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-center text-slate-400 font-medium font-mono">
                      {item.unit}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <button
                        type="button"
                        onClick={() => onRemoveItem(idx)}
                        title="Xóa hóa chất này"
                        className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
