import React from "react";
import { Package } from "lucide-react";
import { formatCurrency } from "../../../../lib/utils";

export function StockInInputs({
  selectedProduct,
  register,
  errors,
  totalCostEstimate,
  totalVolumeAdded,
}) {
  return (
    <>
      {/* Selected Product Summary Card */}
      {selectedProduct && (
        <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200/80 flex items-center justify-between text-xs text-emerald-900">
          <div className="flex items-center gap-2.5">
            <Package className="w-4 h-4 text-emerald-700 shrink-0" aria-hidden="true" />
            <div>
              <span className="font-bold">{selectedProduct.name}</span>
              <p className="text-[11px] text-emerald-800 mt-0.5">
                SKU: {selectedProduct.sku} • Quy cách: 1 {selectedProduct.unit} = {selectedProduct.volumeOrWeightPerUnit} {selectedProduct.volumeUnit}
              </p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-lg bg-white/80 border border-emerald-200 font-bold text-emerald-800">
            Giá vốn gốc: {formatCurrency(selectedProduct.costPrice)}
          </span>
        </div>
      )}

      {/* Quantity Units & Unit Cost Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Quantity */}
        <div>
          <label
            htmlFor="stock-quantity"
            className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
          >
            Số lượng kiện / chai nguyên seal <span className="text-emerald-600">*</span>
          </label>
          <div className="relative">
            <input
              id="stock-quantity"
              type="number"
              min="1"
              step="1"
              {...register("quantityUnits")}
              aria-invalid={Boolean(errors.quantityUnits)}
              aria-describedby={errors.quantityUnits ? "stock-quantity-error" : undefined}
              className={`w-full h-11 pl-3.5 pr-14 rounded-xl border text-sm text-slate-900 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 transition-all ${
                errors.quantityUnits
                  ? "border-rose-400 focus:ring-rose-400/30"
                  : "border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/20"
              }`}
            />
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 pointer-events-none">
              {selectedProduct?.unit || "Đơn vị"}
            </div>
          </div>
          {errors.quantityUnits && (
            <p id="stock-quantity-error" className="mt-1 text-xs text-rose-600 font-medium">
              {errors.quantityUnits.message}
            </p>
          )}
        </div>

        {/* Unit Cost */}
        <div>
          <label
            htmlFor="stock-unit-cost"
            className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
          >
            Đơn giá nhập thực tế (VND)
          </label>
          <div className="relative">
            <input
              id="stock-unit-cost"
              type="number"
              min="0"
              step="1000"
              {...register("unitCost")}
              aria-invalid={Boolean(errors.unitCost)}
              aria-describedby={errors.unitCost ? "stock-unit-cost-error" : undefined}
              placeholder="Theo giá vốn catalog"
              className="w-full h-11 pl-3.5 pr-14 rounded-xl border border-slate-200 bg-slate-50/50 text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
            />
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 pointer-events-none">
              VNĐ
            </div>
          </div>
          {errors.unitCost && (
            <p id="stock-unit-cost-error" className="mt-1 text-xs text-rose-600 font-medium">
              {errors.unitCost.message}
            </p>
          )}
          <p className="mt-1 text-[11px] text-slate-500 font-medium">
            Thành tiền: {formatCurrency(totalCostEstimate)}
          </p>
        </div>
      </div>

      {/* Calculated Volume Preview */}
      {selectedProduct && (
        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs text-slate-700">
          <span className="text-slate-500">Tổng dung tích thực nhập vào kho:</span>
          <span className="font-extrabold text-slate-900 text-sm">
            +{new Intl.NumberFormat("vi-VN").format(totalVolumeAdded)} {selectedProduct.volumeUnit}
          </span>
        </div>
      )}
    </>
  );
}
