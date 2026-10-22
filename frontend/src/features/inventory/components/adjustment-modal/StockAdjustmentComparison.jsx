import React from "react";
import { TrendingUp, TrendingDown } from "lucide-react";

export function StockAdjustmentComparison({ selectedItem, register, errors, volumeDelta }) {
  if (!selectedItem) return null;

  return (
    <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200/80 space-y-3">
      <div className="flex items-center justify-between text-xs">
        <span className="font-bold text-amber-900">Số liệu hệ thống đang ghi nhận:</span>
        <span className="font-extrabold text-slate-800">
          {selectedItem.isExistingInBranch ? (
            `${selectedItem.stockUnits} ${selectedItem.packagingUnit} nguyên seal + ${selectedItem.currentVolume} ${selectedItem.volumeUnit} dở dang`
          ) : (
            `Chưa có tồn kho (0 ${selectedItem.packagingUnit} nguyên seal + 0 ${selectedItem.volumeUnit} dở)`
          )}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
        {/* Actual Sealed Units */}
        <div>
          <label
            htmlFor="adj-actual-units"
            className="block text-[11px] font-bold text-slate-700 uppercase mb-1"
          >
            Số {selectedItem.packagingUnit} nguyên seal thực đếm <span className="text-amber-600">*</span>
          </label>
          <div className="relative">
            <input
              id="adj-actual-units"
              type="number"
              min="0"
              step="1"
              {...register("actualStockUnits")}
              aria-invalid={Boolean(errors.actualStockUnits)}
              aria-describedby={errors.actualStockUnits ? "adj-actual-units-error" : undefined}
              className={`w-full h-10 pl-3 pr-14 rounded-xl border text-xs text-slate-900 bg-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500 ${
                errors.actualStockUnits ? "border-rose-400" : "border-slate-200"
              }`}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 pointer-events-none">
              {selectedItem.packagingUnit}
            </div>
          </div>
          {errors.actualStockUnits && (
            <p id="adj-actual-units-error" className="mt-1 text-[11px] text-rose-600 font-medium">
              {errors.actualStockUnits.message}
            </p>
          )}
        </div>

        {/* Actual In-Use Volume */}
        <div>
          <label
            htmlFor="adj-actual-volume"
            className="block text-[11px] font-bold text-slate-700 uppercase mb-1"
          >
            Dung tích chai đang dùng dở <span className="text-amber-600">*</span>
          </label>
          <div className="relative">
            <input
              id="adj-actual-volume"
              type="number"
              min="0"
              step="1"
              {...register("actualVolume")}
              aria-invalid={Boolean(errors.actualVolume)}
              aria-describedby={errors.actualVolume ? "adj-actual-volume-error" : undefined}
              className={`w-full h-10 pl-3 pr-14 rounded-xl border text-xs text-slate-900 bg-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500 ${
                errors.actualVolume ? "border-rose-400" : "border-slate-200"
              }`}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 pointer-events-none">
              {selectedItem.volumeUnit}
            </div>
          </div>
          {errors.actualVolume && (
            <p id="adj-actual-volume-error" className="mt-1 text-[11px] text-rose-600 font-medium">
              {errors.actualVolume.message}
            </p>
          )}
        </div>
      </div>

      {/* Discrepancy / Variance Indicator */}
      <div className="pt-2 border-t border-amber-200/60 flex items-center justify-between text-xs">
        <span className="text-slate-600 font-medium">Chênh lệch sau kiểm kê:</span>
        <div className="flex items-center gap-1.5 font-bold">
          {volumeDelta === 0 ? (
            <span className="text-emerald-700">Khớp số liệu hoàn hảo (0 {selectedItem.volumeUnit})</span>
          ) : volumeDelta > 0 ? (
            <span className="inline-flex items-center gap-1 text-emerald-700">
              <TrendingUp className="w-3.5 h-3.5" aria-hidden="true" />
              +{new Intl.NumberFormat("vi-VN").format(volumeDelta)} {selectedItem.volumeUnit} (Thừa kho)
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-rose-700">
              <TrendingDown className="w-3.5 h-3.5" aria-hidden="true" />
              {new Intl.NumberFormat("vi-VN").format(volumeDelta)} {selectedItem.volumeUnit} (Hao hụt)
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
