import React, { useState, useEffect, useId } from "react";
import {
  X,
  ArrowDownToLine,
  Package,
  Building2,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { useProducts } from "./useInventory";
import { formatCurrency } from "../../lib/utils";

function StockInInner({
  branchName,
  preselectedProductId = null,
  onClose,
  onSubmit,
  isSubmitting,
  titleId,
}) {
  const { data: products = [], isLoading: isLoadingProducts } = useProducts({
    activeOnly: true,
  });

  const [productId, setProductId] = useState(() => {
    if (preselectedProductId) return String(preselectedProductId);
    return products[0]?.id ? String(products[0].id) : "";
  });

  const [quantityUnits, setQuantityUnits] = useState(5);
  const [customUnitCost, setCustomUnitCost] = useState(null);
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState({});

  const selectedProduct = products.find((p) => String(p.id) === String(productId));
  const effectiveUnitCost =
    customUnitCost !== null ? customUnitCost : (selectedProduct?.costPrice ?? "");

  // Derived totals
  const totalVolumeAdded = selectedProduct
    ? (Number(quantityUnits) || 0) * (Number(selectedProduct.volumeOrWeightPerUnit) || 0)
    : 0;

  const totalCostEstimate =
    (Number(quantityUnits) || 0) * (Number(effectiveUnitCost) || 0);

  const validate = () => {
    const errs = {};
    if (!productId) errs.productId = "Vui lòng chọn sản phẩm nhập kho";
    if (quantityUnits === "" || Number(quantityUnits) < 1) {
      errs.quantityUnits = "Số lượng nhập kho phải tối thiểu 1 đơn vị";
    }
    if (effectiveUnitCost !== "" && Number(effectiveUnitCost) < 0) {
      errs.unitCost = "Đơn giá nhập không thể âm";
    }

    setErrors(errs);
    return { isValid: Object.keys(errs).length === 0, errs };
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const { isValid } = validate();
    if (!isValid) return;

    const payload = {
      productId: Number(productId),
      quantityUnits: Number(quantityUnits),
      unitCost: effectiveUnitCost !== "" ? Number(effectiveUnitCost) : null,
      notes: notes.trim() || null,
    };

    onSubmit(payload);
  };

  return (
    <>
      {/* Modal Header */}
      <div className="flex items-center justify-between px-6 py-4.5 border-b border-slate-100 bg-slate-50/60">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
            <ArrowDownToLine className="w-5 h-5" aria-hidden="true" />
          </div>
          <div>
            <h2 id={titleId} className="text-lg font-bold text-slate-900 leading-tight">
              Nhập kho Sản phẩm / Vật tư
            </h2>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
              <Building2 className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
              <span>Kho chi nhánh: <strong className="text-slate-700">{branchName || "Chi nhánh hiện tại"}</strong></span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          disabled={isSubmitting}
          aria-label="Đóng cửa sổ"
          className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
        >
          <X className="w-5 h-5" aria-hidden="true" />
        </button>
      </div>

      {/* Form Errors */}
      {Object.keys(errors).length > 0 && (
        <div
          role="alert"
          className="mx-6 mt-4 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2.5 animate-in fade-in"
        >
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" aria-hidden="true" />
          <div className="flex-1 font-medium">
            Vui lòng kiểm tra lại thông tin nhập kho bên dưới.
          </div>
        </div>
      )}

      {/* Form Content */}
      <form id="stock-in-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4.5">
        {/* Product Selection */}
        <div>
          <label
            htmlFor="stock-product"
            className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
          >
            Sản phẩm master nhập về <span className="text-emerald-600">*</span>
          </label>
          {isLoadingProducts ? (
            <div className="h-11 flex items-center px-3.5 rounded-xl border border-slate-200 text-xs text-slate-400">
              <Loader2 className="w-4 h-4 animate-spin mr-2" aria-hidden="true" />
              Đang tải danh mục sản phẩm...
            </div>
          ) : (
            <select
              id="stock-product"
              value={productId}
              aria-invalid={Boolean(errors.productId)}
              aria-describedby={errors.productId ? "stock-product-error" : undefined}
              onChange={(e) => {
                const newId = e.target.value;
                setProductId(newId);
                setCustomUnitCost(null);
                if (errors.productId) setErrors((prev) => ({ ...prev, productId: null }));
              }}
              className={`w-full h-11 px-3.5 rounded-xl border text-sm text-slate-900 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 cursor-pointer transition-all ${
                errors.productId
                  ? "border-rose-400 focus:ring-rose-400/30"
                  : "border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/20"
              }`}
            >
              <option value="">-- Chọn sản phẩm trong catalog --</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.sku}) - {p.volumeOrWeightPerUnit} {p.volumeUnit}/{p.unit}
                </option>
              ))}
            </select>
          )}
          {errors.productId && (
            <p id="stock-product-error" className="mt-1 text-xs text-rose-600 font-medium">{errors.productId}</p>
          )}
        </div>

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
                value={quantityUnits}
                aria-invalid={Boolean(errors.quantityUnits)}
                aria-describedby={errors.quantityUnits ? "stock-quantity-error" : undefined}
                onChange={(e) => {
                  setQuantityUnits(e.target.value);
                  if (errors.quantityUnits)
                    setErrors((prev) => ({ ...prev, quantityUnits: null }));
                }}
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
              <p id="stock-quantity-error" className="mt-1 text-xs text-rose-600 font-medium">{errors.quantityUnits}</p>
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
                value={effectiveUnitCost}
                aria-invalid={Boolean(errors.unitCost)}
                aria-describedby={errors.unitCost ? "stock-unit-cost-error" : undefined}
                onChange={(e) => {
                  setCustomUnitCost(e.target.value);
                  if (errors.unitCost) setErrors((prev) => ({ ...prev, unitCost: null }));
                }}
                placeholder="Theo giá vốn catalog"
                className="w-full h-11 pl-3.5 pr-14 rounded-xl border border-slate-200 bg-slate-50/50 text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
              />
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 pointer-events-none">
                VNĐ
              </div>
            </div>
            {errors.unitCost && (
              <p id="stock-unit-cost-error" className="mt-1 text-xs text-rose-600 font-medium">{errors.unitCost}</p>
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

        {/* Notes */}
        <div>
          <label
            htmlFor="stock-notes"
            className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
          >
            Ghi chú nhập kho / Số lô / Nhà cung cấp
          </label>
          <textarea
            id="stock-notes"
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Ví dụ: Lô hàng nhập từ NPP L'Oreal Việt Nam, HĐ 9812..."
            className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:bg-white focus:outline-none transition-all placeholder:text-slate-400"
          />
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
          form="stock-in-form"
          disabled={isSubmitting}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 text-white font-semibold text-xs shadow-md shadow-emerald-600/20 active:scale-[0.99] transition-all flex items-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
              <span>Đang nhập kho...</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
              <span>Xác nhận nhập kho</span>
            </>
          )}
        </button>
      </div>
    </>
  );
}

export function StockInModal({
  isOpen,
  onClose,
  branchName,
  preselectedProductId = null,
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
        className="relative w-full max-w-xl my-6 bg-white rounded-3xl shadow-2xl border border-slate-200/90 flex flex-col max-h-[92vh] overflow-hidden animate-in zoom-in-95 duration-200"
      >
        <StockInInner
          key={preselectedProductId ? `prod-${preselectedProductId}` : "stockin"}
          branchName={branchName}
          preselectedProductId={preselectedProductId}
          onClose={onClose}
          onSubmit={onSubmit}
          isSubmitting={isSubmitting}
          titleId={titleId}
        />
      </div>
    </div>
  );
}
