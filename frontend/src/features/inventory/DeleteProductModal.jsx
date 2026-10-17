import React, { useEffect, useId } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import { formatCurrency } from "../../lib/utils";

export function DeleteProductModal({
  isOpen,
  onClose,
  product,
  onConfirm,
  isDeleting = false,
}) {
  const titleId = useId();

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen && !isDeleting) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isDeleting, onClose]);

  if (!isOpen || !product) return null;

  return (
    <div
      role="presentation"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 space-y-5 animate-in zoom-in-95 duration-200"
      >
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-6 h-6" aria-hidden="true" />
          </div>
          <div>
            <h3 id={titleId} className="text-base font-bold text-slate-900">
              Xác nhận xóa mặt hàng
            </h3>
            <p className="text-xs text-slate-500">
              Mặt hàng sẽ bị vô hiệu hóa trong danh mục toàn hệ thống.
            </p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs text-slate-700">
          <div className="flex justify-between">
            <span className="text-slate-400">Tên mặt hàng:</span>
            <span className="font-bold text-slate-900 text-right">{product.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Mã SKU:</span>
            <span className="font-mono font-medium text-slate-800">{product.sku}</span>
          </div>
          {product.barcode && (
            <div className="flex justify-between">
              <span className="text-slate-400">Mã vạch / Barcode:</span>
              <span className="font-mono text-slate-600">{product.barcode}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-slate-400">Quy cách đóng gói:</span>
            <span className="font-medium text-slate-700">
              {product.unit} ({product.volumeOrWeightPerUnit} {product.volumeUnit})
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Giá nhập vốn:</span>
            <span className="font-medium text-slate-800">{formatCurrency(product.costPrice)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Giá bán lẻ:</span>
            <span className="font-bold text-pink-600">{formatCurrency(product.retailPrice)}</span>
          </div>
        </div>

        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200/70 rounded-xl p-3">
          Lưu ý: Nếu mặt hàng đang có tồn kho tại chi nhánh hoặc nằm trong công thức BOM dịch vụ, việc xóa có thể ảnh hưởng đến kiểm kê và tự động trừ kho.
        </p>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="min-h-[44px] px-5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold text-xs transition-colors cursor-pointer disabled:opacity-50 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-amber-500"
          >
            Hủy bỏ
          </button>

          <button
            type="button"
            onClick={() => onConfirm(product.id)}
            disabled={isDeleting}
            className="min-h-[44px] px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs shadow-md shadow-rose-500/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-60 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-rose-500"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                <span>Đang xóa...</span>
              </>
            ) : (
              <span>Xác nhận xóa</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
