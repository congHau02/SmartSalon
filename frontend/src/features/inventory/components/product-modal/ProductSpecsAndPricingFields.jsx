import React from "react";
import { PACKAGING_UNITS, VOLUME_UNITS } from "../../constants";
import { formatCurrency } from "../../../../lib/utils";

export function ProductSpecsAndPricingFields({
  register,
  errors,
  watchedCostPrice,
  watchedRetailPrice,
}) {
  return (
    <>
      {/* Packaging Unit & Volume Specs */}
      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-4">
        <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
          Quy cách đóng gói & Dung tích thực
        </span>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          {/* Packaging Unit */}
          <div>
            <label
              htmlFor="product-unit"
              className="block text-[11px] font-bold text-slate-600 uppercase mb-1"
            >
              Đơn vị tính (Gốc) <span className="text-pink-600">*</span>
            </label>
            <select
              id="product-unit"
              {...register("unit")}
              className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 focus:border-pink-500 focus:ring-1 focus:ring-pink-500 cursor-pointer"
            >
              {PACKAGING_UNITS.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </div>

          {/* Volume per Unit */}
          <div>
            <label
              htmlFor="product-volume"
              className="block text-[11px] font-bold text-slate-600 uppercase mb-1"
            >
              Dung tích/Khối lượng <span className="text-pink-600">*</span>
            </label>
            <input
              id="product-volume"
              type="number"
              min="0.1"
              step="0.5"
              {...register("volumeOrWeightPerUnit")}
              aria-invalid={Boolean(errors.volumeOrWeightPerUnit)}
              aria-describedby={errors.volumeOrWeightPerUnit ? "product-volume-error" : undefined}
              placeholder="500"
              className={`w-full h-10 px-3 rounded-xl border text-xs text-slate-900 bg-white focus:border-pink-500 focus:ring-1 focus:ring-pink-500 ${
                errors.volumeOrWeightPerUnit ? "border-rose-400" : "border-slate-200"
              }`}
            />
            {errors.volumeOrWeightPerUnit && (
              <p id="product-volume-error" className="mt-1 text-[11px] text-rose-600 font-medium">
                {errors.volumeOrWeightPerUnit.message}
              </p>
            )}
          </div>

          {/* Volume Unit */}
          <div>
            <label
              htmlFor="product-volume-unit"
              className="block text-[11px] font-bold text-slate-600 uppercase mb-1"
            >
              Đơn vị thể tích <span className="text-pink-600">*</span>
            </label>
            <select
              id="product-volume-unit"
              {...register("volumeUnit")}
              className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 focus:border-pink-500 focus:ring-1 focus:ring-pink-500 cursor-pointer"
            >
              {VOLUME_UNITS.map((vu) => (
                <option key={vu} value={vu}>
                  {vu}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Pricing & Min Stock Alert */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label
            htmlFor="product-cost-price"
            className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
          >
            Giá vốn tiêu chuẩn (VND)
          </label>
          <div className="relative">
            <input
              id="product-cost-price"
              type="number"
              min="0"
              step="5000"
              {...register("costPrice")}
              aria-invalid={Boolean(errors.costPrice)}
              aria-describedby={errors.costPrice ? "product-cost-price-error" : undefined}
              className={`w-full h-11 pl-3.5 pr-14 rounded-xl border text-sm text-slate-900 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 transition-all ${
                errors.costPrice
                  ? "border-rose-400 focus:ring-rose-400/30"
                  : "border-slate-200 focus:border-pink-500 focus:ring-pink-500/20"
              }`}
            />
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 pointer-events-none">
              VNĐ
            </div>
          </div>
          {errors.costPrice && (
            <p id="product-cost-price-error" className="mt-1 text-xs text-rose-600 font-medium">
              {errors.costPrice.message}
            </p>
          )}
          <p className="mt-1 text-[11px] text-slate-500 font-medium">
            {formatCurrency(Number(watchedCostPrice) || 0)}
          </p>
        </div>

        <div>
          <label
            htmlFor="product-retail-price"
            className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
          >
            Giá bán lẻ (nếu có)
          </label>
          <div className="relative">
            <input
              id="product-retail-price"
              type="number"
              min="0"
              step="5000"
              {...register("retailPrice")}
              aria-invalid={Boolean(errors.retailPrice)}
              aria-describedby={errors.retailPrice ? "product-retail-price-error" : undefined}
              className={`w-full h-11 pl-3.5 pr-14 rounded-xl border text-sm text-slate-900 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 transition-all ${
                errors.retailPrice
                  ? "border-rose-400 focus:ring-rose-400/30"
                  : "border-slate-200 focus:border-pink-500 focus:ring-pink-500/20"
              }`}
            />
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 pointer-events-none">
              VNĐ
            </div>
          </div>
          {errors.retailPrice && (
            <p id="product-retail-price-error" className="mt-1 text-xs text-rose-600 font-medium">
              {errors.retailPrice.message}
            </p>
          )}
          <p className="mt-1 text-[11px] text-slate-500 font-medium">
            {formatCurrency(Number(watchedRetailPrice) || 0)}
          </p>
        </div>

        <div>
          <label
            htmlFor="product-min-stock"
            className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
          >
            Ngưỡng cảnh báo hết hàng
          </label>
          <div className="relative">
            <input
              id="product-min-stock"
              type="number"
              min="0"
              step="1"
              {...register("minStockAlertUnits")}
              aria-invalid={Boolean(errors.minStockAlertUnits)}
              aria-describedby={errors.minStockAlertUnits ? "product-min-stock-error" : undefined}
              className={`w-full h-11 pl-3.5 pr-14 rounded-xl border text-sm text-slate-900 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 transition-all ${
                errors.minStockAlertUnits
                  ? "border-rose-400 focus:ring-rose-400/30"
                  : "border-slate-200 focus:border-pink-500 focus:ring-pink-500/20"
              }`}
            />
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 pointer-events-none">
              kiện
            </div>
          </div>
          {errors.minStockAlertUnits && (
            <p id="product-min-stock-error" className="mt-1 text-xs text-rose-600 font-medium">
              {errors.minStockAlertUnits.message}
            </p>
          )}
        </div>
      </div>

      {/* Active Toggle */}
      <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
        <div>
          <span className="text-sm font-bold text-slate-900">Trạng thái sử dụng</span>
          <p className="text-xs text-slate-500">
            Sản phẩm có sẵn để cấu hình BOM dịch vụ và nhập xuất tồn kho
          </p>
        </div>

        <label className="relative inline-flex items-center cursor-pointer min-h-[44px] min-w-[44px] justify-center">
          <input
            type="checkbox"
            {...register("isActive")}
            className="sr-only peer"
            aria-label="Kích hoạt sản phẩm"
          />
          <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[12px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pink-600" />
        </label>
      </div>
    </>
  );
}
