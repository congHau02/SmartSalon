import React, { useState } from "react";
import { Plus, X } from "lucide-react";

export function AddConsumableModal({
  isOpen,
  onClose,
  products = [],
  onAddChemical,
}) {
  const [selectedProductId, setSelectedProductId] = useState("");
  const [chemicalAmount, setChemicalAmount] = useState(30);

  if (!isOpen) return null;

  const handleAdd = () => {
    if (!selectedProductId) return;
    onAddChemical({
      productId: Number(selectedProductId),
      amount: Number(chemicalAmount) || 0,
    });
    setSelectedProductId("");
    setChemicalAmount(30);
  };

  return (
    <div className="p-4 bg-slate-800/95 border border-pink-500/30 rounded-2xl space-y-3 animate-in fade-in duration-150">
      <div className="flex items-center justify-between">
        <h5 className="text-xs font-bold text-pink-300 flex items-center gap-1.5">
          <Plus className="w-4 h-4" />
          <span>Chọn sản phẩm hóa chất bổ sung</span>
        </h5>
        <button
          type="button"
          onClick={onClose}
          className="text-slate-400 hover:text-white cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="sm:col-span-2 space-y-1">
          <label className="text-[11px] text-slate-400">Sản phẩm vật tư</label>
          <select
            value={selectedProductId}
            onChange={(e) => setSelectedProductId(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-pink-500"
          >
            <option value="">-- Chọn sản phẩm từ kho --</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.unit || "ml"} - SKU: {p.sku})
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-[11px] text-slate-400">Số lượng (ml / gram)</label>
          <input
            type="number"
            min="1"
            step="1"
            value={chemicalAmount}
            onChange={(e) => setChemicalAmount(Number(e.target.value))}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-bold text-white focus:outline-none focus:border-pink-500"
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-1">
        <button
          type="button"
          onClick={onClose}
          className="px-3 py-1.5 rounded-xl border border-slate-700 text-xs text-slate-300 hover:bg-slate-700 transition cursor-pointer"
        >
          Hủy
        </button>
        <button
          type="button"
          disabled={!selectedProductId}
          onClick={handleAdd}
          className="px-4 py-1.5 rounded-xl bg-pink-600 hover:bg-pink-500 disabled:opacity-50 text-xs font-semibold text-white transition cursor-pointer"
        >
          Thêm vào bảng tiêu hao
        </button>
      </div>
    </div>
  );
}
