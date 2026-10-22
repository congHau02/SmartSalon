import React from "react";

export function ProductIdentityFields({ register, errors, isEditMode }) {
  return (
    <>
      {/* Name */}
      <div>
        <label
          htmlFor="product-name"
          className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
        >
          Tên sản phẩm / vật tư <span className="text-pink-600">*</span>
        </label>
        <input
          id="product-name"
          type="text"
          {...register("name")}
          aria-invalid={Boolean(errors.name)}
          aria-describedby={errors.name ? "product-name-error" : undefined}
          placeholder="Ví dụ: Kem nhuộm tóc L'Oreal Inoa 60g, Dầu gội Olaplex No.4..."
          className={`w-full h-11 px-3.5 rounded-xl border text-sm text-slate-900 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 transition-all ${
            errors.name
              ? "border-rose-400 focus:ring-rose-400/30"
              : "border-slate-200 focus:border-pink-500 focus:ring-pink-500/20"
          }`}
        />
        {errors.name && (
          <p id="product-name-error" className="mt-1 text-xs text-rose-600 font-medium">
            {errors.name.message}
          </p>
        )}
      </div>

      {/* SKU and Barcode Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="product-sku"
            className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
          >
            Mã SKU định danh <span className="text-pink-600">*</span>
          </label>
          <input
            id="product-sku"
            type="text"
            disabled={isEditMode}
            {...register("sku")}
            aria-invalid={Boolean(errors.sku)}
            aria-describedby={errors.sku ? "product-sku-error" : undefined}
            placeholder="Ví dụ: LOR-INOA-60, OLA-NO4-250"
            className={`w-full h-11 px-3.5 rounded-xl border text-sm uppercase text-slate-900 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 transition-all ${
              isEditMode ? "opacity-60 cursor-not-allowed bg-slate-100" : ""
            } ${
              errors.sku
                ? "border-rose-400 focus:ring-rose-400/30"
                : "border-slate-200 focus:border-pink-500 focus:ring-pink-500/20"
            }`}
          />
          {errors.sku && (
            <p id="product-sku-error" className="mt-1 text-xs text-rose-600 font-medium">
              {errors.sku.message}
            </p>
          )}
          {isEditMode && (
            <p className="mt-1 text-[11px] text-slate-400">Mã SKU là duy nhất và không thể thay đổi</p>
          )}
        </div>

        <div>
          <label
            htmlFor="product-barcode"
            className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
          >
            Mã vạch Barcode (tùy chọn)
          </label>
          <input
            id="product-barcode"
            type="text"
            {...register("barcode")}
            placeholder="Quét mã vạch hoặc nhập số EAN/UPC..."
            className="w-full h-11 px-3.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 transition-all placeholder:text-slate-400"
          />
        </div>
      </div>
    </>
  );
}
