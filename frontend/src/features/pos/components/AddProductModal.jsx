import React, { useState } from "react";
import { ShoppingBag, X, Check, Loader2 } from "lucide-react";
import { formatCurrency } from "../../../lib/utils";

export function AddProductModal({
  isOpen,
  onClose,
  products = [],
  onAddProduct,
  isPending,
}) {
  const [selectedProductId, setSelectedProductId] = useState("");
  const [quantity, setQuantity] = useState(1);

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (!selectedProductId) return;
    onAddProduct({
      productId: Number(selectedProductId),
      quantity,
    });
  };

  return (
    <div className="fixed inset-0 z-60 bg-black/70 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-5 space-y-4 shadow-2xl animate-in zoom-in-95">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-bold text-white flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-purple-400" />
            <span>Thêm Sản Phẩm Bán Lẻ</span>
          </h4>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white cursor-pointer"
            aria-label="Đóng cửa sổ thêm sản phẩm"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3 text-xs">
          <div>
            <label className="block text-slate-300 mb-1 font-semibold">Chọn Sản phẩm</label>
            <select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-pink-500"
            >
              <option value="">-- Chọn sản phẩm bán lẻ --</option>
              {products.map((prod) => (
                <option key={prod.id} value={prod.id}>
                  {prod.name} ({prod.sku}) - {formatCurrency(prod.retailPrice)} / {prod.unit}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-300 mb-1 font-semibold">Số lượng bán</label>
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-pink-500 font-mono"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
          >
            Hủy
          </button>
          <button
            type="button"
            disabled={!selectedProductId || isPending}
            onClick={handleSubmit}
            className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
          >
            {isPending ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Check className="w-3.5 h-3.5" />
            )}
            <span>Thêm Sản Phẩm</span>
          </button>
        </div>
      </div>
    </div>
  );
}
