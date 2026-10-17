import React, { useEffect, useId } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import { formatCurrency } from "../../lib/utils";

export function DeleteConfirmModal({
  isOpen,
  onClose,
  service,
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

  if (!isOpen || !service) return null;

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
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h3 id={titleId} className="text-base font-bold text-slate-900">
              Xác nhận xóa dịch vụ
            </h3>
            <p className="text-xs text-slate-500">
              Hành động này sẽ ẩn dịch vụ khỏi bảng giá bán và hệ thống đặt lịch.
            </p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5 text-xs text-slate-700">
          <div className="flex justify-between">
            <span className="text-slate-400">Tên dịch vụ:</span>
            <span className="font-bold text-slate-900">{service.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Danh mục:</span>
            <span className="font-semibold text-slate-800">{service.category}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Giá niêm yết:</span>
            <span className="font-bold text-pink-600">{formatCurrency(service.basePrice)}</span>
          </div>
          {service.bomList?.length > 0 && (
            <div className="flex justify-between">
              <span className="text-slate-400">Vật tư BOM:</span>
              <span className="font-medium text-slate-700">
                {service.bomList.length} hoá chất cấu hình
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold text-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            Hủy bỏ
          </button>

          <button
            type="button"
            onClick={() => onConfirm(service.id)}
            disabled={isDeleting}
            className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs shadow-md shadow-rose-500/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-60"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Đang xóa...</span>
              </>
            ) : (
              <span>Xóa dịch vụ</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
