import React, { useState } from "react";
import { Scissors, X, Check, Loader2 } from "lucide-react";
import { formatCurrency } from "../../../lib/utils";

export function AddServiceModal({
  isOpen,
  onClose,
  services = [],
  stylists = [],
  onAddService,
  isPending,
}) {
  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [selectedStaffId, setSelectedStaffId] = useState("");

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (!selectedServiceId) return;
    onAddService({
      serviceId: Number(selectedServiceId),
      staffId: selectedStaffId ? Number(selectedStaffId) : undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-60 bg-black/70 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-5 space-y-4 shadow-2xl animate-in zoom-in-95">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-bold text-white flex items-center gap-2">
            <Scissors className="w-4 h-4 text-pink-400" />
            <span>Thêm Dịch Vụ vào Đơn Hàng</span>
          </h4>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white cursor-pointer"
            aria-label="Đóng cửa sổ thêm dịch vụ"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3 text-xs">
          <div>
            <label className="block text-slate-300 mb-1 font-semibold">Chọn Dịch vụ</label>
            <select
              value={selectedServiceId}
              onChange={(e) => setSelectedServiceId(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-pink-500"
            >
              <option value="">-- Chọn dịch vụ từ danh mục --</option>
              {services.map((svc) => (
                <option key={svc.id} value={svc.id}>
                  {svc.name} - {formatCurrency(svc.basePrice)} ({svc.durationMinutes} phút)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-300 mb-1 font-semibold">
              Chỉ định Stylist thực hiện (mặc định cho các bước)
            </label>
            <select
              value={selectedStaffId}
              onChange={(e) => setSelectedStaffId(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-pink-500"
            >
              <option value="">-- Stylist phụ trách chính --</option>
              {stylists.map((st) => (
                <option key={st.stylistId || st.id} value={st.stylistId || st.id}>
                  {st.fullName || st.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
          >
            Hủy
          </button>
          <button
            type="button"
            disabled={!selectedServiceId || isPending}
            onClick={handleSubmit}
            className="px-4 py-2 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-xs font-bold disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
          >
            {isPending ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Check className="w-3.5 h-3.5" />
            )}
            <span>Thêm Dịch Vụ</span>
          </button>
        </div>
      </div>
    </div>
  );
}
