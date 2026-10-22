import React from "react";
import { Scissors, Clock, Check, ShoppingBag, Plus, Minus } from "lucide-react";
import { formatCurrency } from "../../../lib/utils";

export function WalkInItemSelection({
  servicesState,
  productsState,
  services = servicesState?.items || [],
  selectedServiceIds = servicesState?.selectedIds || [],
  toggleService = servicesState?.onToggle,
  totalDuration = servicesState?.totalDuration || 0,
  products = productsState?.items || [],
  selectedProducts = productsState?.selectedItems || [],
  addProduct = productsState?.onAdd,
  updateProductQuantity = productsState?.onUpdateQuantity,
}) {
  return (
    <div className="space-y-4">
      {/* Services Selection */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-medium text-slate-300 flex items-center gap-1">
            <Scissors className="w-3.5 h-3.5 text-pink-400" />
            <span>Chọn dịch vụ ({selectedServiceIds.length})</span>
          </label>
          {totalDuration > 0 && (
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <Clock className="w-3 h-3" /> ~{totalDuration} phút
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-44 overflow-y-auto p-1 scrollbar-thin">
          {services.map((svc) => {
            const isSelected = selectedServiceIds.includes(svc.id);
            return (
              <div
                key={svc.id}
                role="checkbox"
                aria-checked={isSelected}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    toggleService(svc.id);
                  }
                }}
                onClick={() => toggleService(svc.id)}
                className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all flex items-center justify-between ${
                  isSelected
                    ? "bg-pink-500/10 border-pink-500/50 text-white"
                    : "bg-slate-800/60 border-slate-700/60 text-slate-300 hover:border-slate-600"
                }`}
              >
                <div className="min-w-0 pr-2">
                  <p className="text-xs font-semibold truncate">{svc.name}</p>
                  <p className="text-[11px] text-pink-400 font-mono mt-0.5">
                    {formatCurrency(svc.basePrice)}
                  </p>
                </div>
                <div
                  className={`w-4 h-4 rounded flex items-center justify-center shrink-0 ${
                    isSelected ? "bg-pink-500 text-white" : "border border-slate-600"
                  }`}
                >
                  {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Retail Products Selection (Optional) */}
      {products.length > 0 && (
        <div>
          <label className="text-xs font-medium text-slate-300 mb-2 flex items-center gap-1">
            <ShoppingBag className="w-3.5 h-3.5 text-purple-400" />
            <span>Sản phẩm bán lẻ mang về (Tùy chọn)</span>
          </label>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
            {products.map((prod) => {
              const current = selectedProducts.find((p) => p.productId === prod.id);
              const qty = current ? current.quantity : 0;
              return (
                <div
                  key={prod.id}
                  className={`flex-shrink-0 w-48 p-2.5 rounded-xl border ${
                    qty > 0
                      ? "bg-purple-500/10 border-purple-500/40"
                      : "bg-slate-800/60 border-slate-700/60"
                  }`}
                >
                  <p className="text-xs font-medium text-slate-200 truncate">{prod.name}</p>
                  <p className="text-[11px] font-mono text-purple-400 mt-0.5">
                    {formatCurrency(prod.retailPrice)}
                  </p>
                  <div className="mt-2 flex items-center justify-between">
                    {qty === 0 ? (
                      <button
                        type="button"
                        onClick={() => addProduct(prod.id)}
                        className="w-full py-1 px-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-xs text-slate-200 flex items-center justify-center gap-1 transition-colors cursor-pointer"
                      >
                        <Plus className="w-3 h-3" /> Thêm
                      </button>
                    ) : (
                      <div className="flex items-center gap-2 w-full justify-between bg-slate-800 px-2 py-0.5 rounded-lg border border-slate-700">
                        <button
                          type="button"
                          onClick={() => updateProductQuantity(prod.id, -1)}
                          aria-label="Giảm số lượng"
                          className="w-11 h-11 -my-3 flex items-center justify-center text-slate-400 hover:text-white cursor-pointer"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-xs font-bold text-white">{qty}</span>
                        <button
                          type="button"
                          onClick={() => updateProductQuantity(prod.id, 1)}
                          aria-label="Tăng số lượng"
                          className="w-11 h-11 -my-3 flex items-center justify-center text-slate-400 hover:text-white cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
