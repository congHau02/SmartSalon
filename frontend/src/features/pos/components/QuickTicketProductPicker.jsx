import React from "react";
import { Minus, Plus } from "lucide-react";
import { formatVND } from "../../../lib/utils";

export function QuickTicketProductPicker({ products = [], quantities, onChange }) {
  if (products.length === 0) return null;
  return (
    <div>
      <label className="text-[11px] font-semibold text-slate-300 block mb-1.5">Sản phẩm bán lẻ (tuỳ chọn)</label>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-32 overflow-y-auto pr-1">
        {products.map((p) => {
          const qty = quantities[p.id] || 0;
          return (
            <div key={p.id} className="flex items-center justify-between p-2 rounded-xl border border-slate-700 bg-slate-800/60">
              <div>
                <div className="text-xs font-semibold text-slate-200">{p.name}</div>
                <div className="text-[10px] font-mono text-pink-400">{formatVND(p.retailPrice ?? p.price)}</div>
              </div>
              <div className="flex items-center gap-1.5">
                <button type="button" aria-label="Giảm" onClick={() => onChange(p.id, qty - 1)} className="p-1 rounded bg-slate-700 text-slate-300 cursor-pointer">
                  <Minus className="w-3 h-3" />
                </button>
                <span className="text-xs font-mono w-4 text-center text-white">{qty}</span>
                <button type="button" aria-label="Tăng" onClick={() => onChange(p.id, qty + 1)} className="p-1 rounded bg-slate-700 text-slate-300 cursor-pointer">
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
