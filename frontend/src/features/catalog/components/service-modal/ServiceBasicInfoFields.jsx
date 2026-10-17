import React from "react";
import { formatCurrency } from "../../../../lib/utils";
import { PRESET_CATEGORIES } from "../../constants";

export function ServiceBasicInfoFields({
  register,
  errors,
  watchedBasePrice,
  watchedDuration,
  watchedIsCustom,
  setValue,
}) {
  return (
    <div className="space-y-4.5 animate-in fade-in duration-150">
      {/* Service Name */}
      <div>
        <label
          htmlFor="service-name"
          className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
        >
          Tên dịch vụ <span className="text-pink-600">*</span>
        </label>
        <input
          id="service-name"
          type="text"
          {...register("name")}
          placeholder="Ví dụ: Cắt tạo kiểu Master Stylist, Uốn xoăn Hippie..."
          className={`w-full h-11 px-3.5 rounded-xl border text-sm text-slate-900 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 transition-all ${
            errors.name
              ? "border-rose-400 focus:ring-rose-400/30"
              : "border-slate-200 focus:border-pink-500 focus:ring-pink-500/20"
          }`}
        />
        {errors.name && <p className="mt-1 text-xs text-rose-600 font-medium">{errors.name.message}</p>}
      </div>

      {/* Category Selection */}
      <div>
        <label
          htmlFor="service-category"
          className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
        >
          Nhóm dịch vụ <span className="text-pink-600">*</span>
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <select
            id="service-category"
            {...register("category", {
              onChange: (e) => {
                if (e.target.value === "__custom__") {
                  setValue("isCustomCategory", true);
                } else {
                  setValue("isCustomCategory", false);
                }
              },
            })}
            className="h-11 px-3.5 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 text-sm focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 focus:bg-white focus:outline-none transition-all cursor-pointer"
          >
            {PRESET_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
            <option value="__custom__">+ Nhập nhóm mới khác...</option>
          </select>

          {watchedIsCustom && (
            <input
              type="text"
              {...register("customCategory")}
              placeholder="Nhập tên nhóm danh mục mới..."
              className="h-11 px-3.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 focus:outline-none transition-all"
            />
          )}
        </div>
        {(errors.category || errors.customCategory) && (
          <p className="mt-1 text-xs text-rose-600 font-medium">
            {errors.category?.message || errors.customCategory?.message}
          </p>
        )}
      </div>

      {/* Price & Duration Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Base Price */}
        <div>
          <label
            htmlFor="service-price"
            className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
          >
            Giá cơ bản (VND) <span className="text-pink-600">*</span>
          </label>
          <div className="relative">
            <input
              id="service-price"
              type="number"
              min="0"
              step="5000"
              {...register("basePrice")}
              className={`w-full h-11 pl-3.5 pr-14 rounded-xl border text-sm text-slate-900 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 transition-all ${
                errors.basePrice
                  ? "border-rose-400 focus:ring-rose-400/30"
                  : "border-slate-200 focus:border-pink-500 focus:ring-pink-500/20"
              }`}
            />
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 pointer-events-none">
              VNĐ
            </div>
          </div>
          <p className="mt-1 text-[11px] text-slate-500 font-medium">
            Hiển thị: {formatCurrency(Number(watchedBasePrice) || 0)}
          </p>
          {errors.basePrice && (
            <p className="mt-0.5 text-xs text-rose-600 font-medium">{errors.basePrice.message}</p>
          )}
        </div>

        {/* Duration in Minutes */}
        <div>
          <label
            htmlFor="service-duration"
            className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
          >
            Thời lượng dự kiến <span className="text-pink-600">*</span>
          </label>
          <div className="relative">
            <input
              id="service-duration"
              type="number"
              min="1"
              step="5"
              {...register("durationMinutes")}
              className={`w-full h-11 pl-3.5 pr-14 rounded-xl border text-sm text-slate-900 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 transition-all ${
                errors.durationMinutes
                  ? "border-rose-400 focus:ring-rose-400/30"
                  : "border-slate-200 focus:border-pink-500 focus:ring-pink-500/20"
              }`}
            />
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 pointer-events-none">
              Phút
            </div>
          </div>
          <p className="mt-1 text-[11px] text-slate-500 font-medium">
            Khoảng: {Math.floor((Number(watchedDuration) || 0) / 60)}h{" "}
            {(Number(watchedDuration) || 0) % 60}m
          </p>
          {errors.durationMinutes && (
            <p className="mt-0.5 text-xs text-rose-600 font-medium">
              {errors.durationMinutes.message}
            </p>
          )}
        </div>
      </div>

      {/* Description */}
      <div>
        <label
          htmlFor="service-desc"
          className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
        >
          Mô tả & Quy trình tóm tắt
        </label>
        <textarea
          id="service-desc"
          rows={3}
          {...register("description")}
          placeholder="Ghi chú về công dụng, đối tượng khách hàng hoặc yêu cầu kỹ thuật đặc biệt..."
          className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 text-sm focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 focus:bg-white focus:outline-none transition-all placeholder:text-slate-400"
        />
      </div>

      {/* Active Toggle Switch */}
      <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
        <div>
          <span className="text-sm font-bold text-slate-900">Trạng thái kinh doanh</span>
          <p className="text-xs text-slate-500">
            Dịch vụ đang mở bán và hiển thị trên giao diện Đặt lịch & POS
          </p>
        </div>

        <label className="relative inline-flex items-center cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center">
          <input
            type="checkbox"
            {...register("isActive")}
            className="sr-only peer"
            aria-label="Kích hoạt dịch vụ"
          />
          <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[12px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pink-600" />
        </label>
      </div>
    </div>
  );
}
