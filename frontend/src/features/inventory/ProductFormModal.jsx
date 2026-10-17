import React, { useState, useEffect, useId } from "react";
import {
  X,
  Package,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { PACKAGING_UNITS, VOLUME_UNITS } from "./constants";
import { formatCurrency } from "../../lib/utils";

function ProductFormInner({
  initialData,
  onClose,
  onSubmit,
  isSubmitting,
  titleId,
}) {
  const isEditMode = Boolean(initialData?.id);

  // Form State
  const [name, setName] = useState(() => initialData?.name || "");
  const [sku, setSku] = useState(() => initialData?.sku || "");
  const [barcode, setBarcode] = useState(() => initialData?.barcode || "");
  const [unit, setUnit] = useState(() => initialData?.unit || PACKAGING_UNITS[0]);
  const [volumeOrWeightPerUnit, setVolumeOrWeightPerUnit] = useState(
    () => initialData?.volumeOrWeightPerUnit ?? 500
  );
  const [volumeUnit, setVolumeUnit] = useState(
    () => initialData?.volumeUnit || VOLUME_UNITS[0]
  );
  const [minStockAlertUnits, setMinStockAlertUnits] = useState(
    () => initialData?.minStockAlertUnits ?? 5
  );
  const [costPrice, setCostPrice] = useState(
    () => initialData?.costPrice ?? 100000
  );
  const [retailPrice, setRetailPrice] = useState(
    () => initialData?.retailPrice ?? 150000
  );
  const [isActive, setIsActive] = useState(
    () => initialData?.isActive !== false
  );

  const [errors, setErrors] = useState({});

  const validate = () => {
    const errs = {};
    if (!name.trim()) errs.name = "Vui lòng nhập tên sản phẩm / vật tư";
    if (!sku.trim()) errs.sku = "Vui lòng nhập mã SKU định danh";
    if (!unit.trim()) errs.unit = "Vui lòng chọn đơn vị đóng gói";
    if (
      volumeOrWeightPerUnit === "" ||
      Number(volumeOrWeightPerUnit) <= 0
    ) {
      errs.volumeOrWeightPerUnit = "Định lượng chuẩn phải lớn hơn 0";
    }
    if (!volumeUnit.trim()) errs.volumeUnit = "Vui lòng chọn đơn vị dung tích";
    if (minStockAlertUnits === "" || Number(minStockAlertUnits) < 0) {
      errs.minStockAlertUnits = "Ngưỡng cảnh báo tồn kho tối thiểu không thể âm";
    }
    if (costPrice === "" || Number(costPrice) < 0) {
      errs.costPrice = "Giá vốn không thể âm";
    }
    if (retailPrice === "" || Number(retailPrice) < 0) {
      errs.retailPrice = "Giá bán lẻ không thể âm";
    }

    setErrors(errs);
    return { isValid: Object.keys(errs).length === 0, errs };
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const { isValid } = validate();
    if (!isValid) return;

    const payload = {
      name: name.trim(),
      sku: sku.trim().toUpperCase(),
      barcode: barcode.trim() || null,
      unit: unit.trim(),
      volumeOrWeightPerUnit: Number(volumeOrWeightPerUnit),
      volumeUnit: volumeUnit.trim(),
      minStockAlertUnits: Number(minStockAlertUnits),
      costPrice: Number(costPrice),
      retailPrice: Number(retailPrice),
      isActive: Boolean(isActive),
    };

    onSubmit(payload);
  };

  return (
    <>
      {/* Modal Header */}
      <div className="flex items-center justify-between px-6 py-4.5 border-b border-slate-100 bg-slate-50/60">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-pink-100 text-pink-700 flex items-center justify-center shrink-0">
            <Package className="w-5 h-5" aria-hidden="true" />
          </div>
          <div>
            <h2 id={titleId} className="text-lg font-bold text-slate-900 leading-tight">
              {isEditMode ? "Chỉnh sửa Sản phẩm Master" : "Tạo Sản phẩm / Vật tư Mới"}
            </h2>
            <p className="text-xs text-slate-500">
              Quy cách đóng gói, định mức thể tích và đơn giá dùng chung toàn hệ thống
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          disabled={isSubmitting}
          aria-label="Đóng cửa sổ"
          className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500"
        >
          <X className="w-5 h-5" aria-hidden="true" />
        </button>
      </div>

      {/* Global Form Errors */}
      {Object.keys(errors).length > 0 && (
        <div
          role="alert"
          className="mx-6 mt-4 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2.5 animate-in fade-in"
        >
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" aria-hidden="true" />
          <div className="flex-1 font-medium">
            Có thông tin chưa hợp lệ. Vui lòng kiểm tra lại các trường được đánh dấu đỏ bên dưới.
          </div>
        </div>
      )}

      {/* Form Body */}
      <form id="product-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4.5">
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
            value={name}
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? "product-name-error" : undefined}
            onChange={(e) => {
              setName(e.target.value);
              if (errors.name) setErrors((prev) => ({ ...prev, name: null }));
            }}
            placeholder="Ví dụ: Oxy trợ nhuộm L'Oreal 6%, Dầu gội bưởi Milbon..."
            className={`w-full h-11 px-3.5 rounded-xl border text-sm text-slate-900 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 transition-all ${
              errors.name
                ? "border-rose-400 focus:ring-rose-400/30"
                : "border-slate-200 focus:border-pink-500 focus:ring-pink-500/20"
            }`}
          />
          {errors.name && <p id="product-name-error" className="mt-1 text-xs text-rose-600 font-medium">{errors.name}</p>}
        </div>

        {/* SKU & Barcode Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="product-sku"
              className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
            >
              Mã SKU <span className="text-pink-600">*</span>
            </label>
            <input
              id="product-sku"
              type="text"
              value={sku}
              aria-invalid={Boolean(errors.sku)}
              aria-describedby={errors.sku ? "product-sku-error" : undefined}
              onChange={(e) => {
                setSku(e.target.value);
                if (errors.sku) setErrors((prev) => ({ ...prev, sku: null }));
              }}
              placeholder="Ví dụ: OXY-06, DAU-GOI-1000"
              className={`w-full h-11 px-3.5 rounded-xl border text-sm uppercase text-slate-900 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 transition-all ${
                errors.sku
                  ? "border-rose-400 focus:ring-rose-400/30"
                  : "border-slate-200 focus:border-pink-500 focus:ring-pink-500/20"
              }`}
            />
            {errors.sku && <p id="product-sku-error" className="mt-1 text-xs text-rose-600 font-medium">{errors.sku}</p>}
          </div>

          <div>
            <label
              htmlFor="product-barcode"
              className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
            >
              Mã vạch Barcode (Tùy chọn)
            </label>
            <input
              id="product-barcode"
              type="text"
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              placeholder="Mã vạch in trên bao bì..."
              className="w-full h-11 px-3.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 transition-all"
            />
          </div>
        </div>

        {/* Packaging Unit & Volume/Weight Specifications */}
        <div className="p-4 rounded-2xl bg-pink-50/50 border border-pink-200/70 space-y-3.5">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-pink-600" aria-hidden="true" />
            <h4 className="text-xs font-bold text-pink-900 uppercase tracking-wider">
              Quy cách đóng gói & Định mức thể tích
            </h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label
                htmlFor="product-unit"
                className="block text-[11px] font-bold text-slate-700 uppercase mb-1"
              >
                Đơn vị đóng gói <span className="text-pink-600">*</span>
              </label>
              <select
                id="product-unit"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 focus:border-pink-500 focus:ring-1 focus:ring-pink-500 cursor-pointer"
              >
                {PACKAGING_UNITS.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="product-volume"
                className="block text-[11px] font-bold text-slate-700 uppercase mb-1"
              >
                Dung tích/khối lượng/đơn vị <span className="text-pink-600">*</span>
              </label>
              <input
                id="product-volume"
                type="number"
                min="0.01"
                step="1"
                value={volumeOrWeightPerUnit}
                aria-invalid={Boolean(errors.volumeOrWeightPerUnit)}
                aria-describedby={errors.volumeOrWeightPerUnit ? "product-volume-error" : undefined}
                onChange={(e) => {
                  setVolumeOrWeightPerUnit(e.target.value);
                  if (errors.volumeOrWeightPerUnit)
                    setErrors((prev) => ({ ...prev, volumeOrWeightPerUnit: null }));
                }}
                placeholder="1000"
                className={`w-full h-10 px-3 rounded-xl border text-xs text-slate-900 bg-white focus:border-pink-500 focus:ring-1 focus:ring-pink-500 ${
                  errors.volumeOrWeightPerUnit ? "border-rose-400" : "border-slate-200"
                }`}
              />
              {errors.volumeOrWeightPerUnit && (
                <p id="product-volume-error" className="mt-1 text-[11px] text-rose-600 font-medium">
                  {errors.volumeOrWeightPerUnit}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="product-volume-unit"
                className="block text-[11px] font-bold text-slate-700 uppercase mb-1"
              >
                Đơn vị đo lường <span className="text-pink-600">*</span>
              </label>
              <select
                id="product-volume-unit"
                value={volumeUnit}
                onChange={(e) => setVolumeUnit(e.target.value)}
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

          <p className="text-[11px] text-pink-800/90 font-medium">
            Quy cách: 1 {unit} = {volumeOrWeightPerUnit} {volumeUnit} (Dùng để tính định mức trừ kho khi làm dịch vụ BOM).
          </p>
        </div>

        {/* Pricing & Min Stock Alert */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label
              htmlFor="product-cost"
              className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
            >
              Giá vốn nhập kho (VND) <span className="text-pink-600">*</span>
            </label>
            <input
              id="product-cost"
              type="number"
              min="0"
              step="5000"
              value={costPrice}
              aria-invalid={Boolean(errors.costPrice)}
              aria-describedby={errors.costPrice ? "product-cost-error" : undefined}
              onChange={(e) => {
                setCostPrice(e.target.value);
                if (errors.costPrice) setErrors((prev) => ({ ...prev, costPrice: null }));
              }}
              className="w-full h-11 px-3.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 transition-all"
            />
            {errors.costPrice && (
              <p id="product-cost-error" className="mt-1 text-xs text-rose-600 font-medium">{errors.costPrice}</p>
            )}
            <p className="mt-1 text-[11px] text-slate-500 font-medium">
              {formatCurrency(Number(costPrice) || 0)}
            </p>
          </div>

          <div>
            <label
              htmlFor="product-retail"
              className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
            >
              Giá bán lẻ (VND) <span className="text-pink-600">*</span>
            </label>
            <input
              id="product-retail"
              type="number"
              min="0"
              step="5000"
              value={retailPrice}
              aria-invalid={Boolean(errors.retailPrice)}
              aria-describedby={errors.retailPrice ? "product-retail-error" : undefined}
              onChange={(e) => {
                setRetailPrice(e.target.value);
                if (errors.retailPrice) setErrors((prev) => ({ ...prev, retailPrice: null }));
              }}
              className="w-full h-11 px-3.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 transition-all"
            />
            {errors.retailPrice && (
              <p id="product-retail-error" className="mt-1 text-xs text-rose-600 font-medium">{errors.retailPrice}</p>
            )}
            <p className="mt-1 text-[11px] text-slate-500 font-medium">
              {formatCurrency(Number(retailPrice) || 0)}
            </p>
          </div>

          <div>
            <label
              htmlFor="product-min-stock"
              className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
            >
              Ngưỡng báo sắp hết (Đơn vị)
            </label>
            <input
              id="product-min-stock"
              type="number"
              min="0"
              value={minStockAlertUnits}
              aria-invalid={Boolean(errors.minStockAlertUnits)}
              aria-describedby={errors.minStockAlertUnits ? "product-min-stock-error" : undefined}
              onChange={(e) => {
                setMinStockAlertUnits(e.target.value);
                if (errors.minStockAlertUnits)
                  setErrors((prev) => ({ ...prev, minStockAlertUnits: null }));
              }}
              className="w-full h-11 px-3.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 transition-all"
            />
            {errors.minStockAlertUnits && (
              <p id="product-min-stock-error" className="mt-1 text-xs text-rose-600 font-medium">{errors.minStockAlertUnits}</p>
            )}
            <p className="mt-1 text-[11px] text-slate-500 font-medium">
              Báo động khi kho ≤ {minStockAlertUnits} {unit}
            </p>
          </div>
        </div>

        {/* Active Toggle Switch */}
        <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
          <div>
            <span className="text-sm font-bold text-slate-900">Trạng thái danh mục</span>
            <p className="text-xs text-slate-500">
              {isActive
                ? "Sản phẩm đang được áp dụng và sẵn sàng nhập kho tại các chi nhánh"
                : "Tạm ngưng nhập hoặc sử dụng sản phẩm này"}
            </p>
          </div>

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="sr-only peer"
              aria-label="Kích hoạt sản phẩm"
            />
            <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pink-600" />
          </label>
        </div>
      </form>

      {/* Footer */}
      <div className="flex items-center justify-end gap-2.5 px-6 py-4 border-t border-slate-100 bg-slate-50/80">
        <button
          type="button"
          onClick={onClose}
          disabled={isSubmitting}
          className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold text-xs transition-colors cursor-pointer disabled:opacity-50"
        >
          Hủy bỏ
        </button>

        <button
          type="submit"
          form="product-form"
          disabled={isSubmitting}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-pink-600 to-rose-500 hover:from-pink-700 hover:to-rose-600 text-white font-semibold text-xs shadow-md shadow-pink-500/20 active:scale-[0.99] transition-all flex items-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
              <span>Đang lưu...</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
              <span>{isEditMode ? "Lưu thay đổi" : "Tạo sản phẩm mới"}</span>
            </>
          )}
        </button>
      </div>
    </>
  );
}

export function ProductFormModal({
  isOpen,
  onClose,
  initialData = null,
  onSubmit,
  isSubmitting = false,
}) {
  const titleId = useId();

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen && !isSubmitting) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="presentation"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative w-full max-w-2xl my-6 bg-white rounded-3xl shadow-2xl border border-slate-200/90 flex flex-col max-h-[92vh] overflow-hidden animate-in zoom-in-95 duration-200"
      >
        <ProductFormInner
          key={initialData?.id ? `edit-${initialData.id}` : "create"}
          initialData={initialData}
          onClose={onClose}
          onSubmit={onSubmit}
          isSubmitting={isSubmitting}
          titleId={titleId}
        />
      </div>
    </div>
  );
}
