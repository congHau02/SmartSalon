import React, { useState, useEffect } from "react";
import { X, Clock, Sparkles } from "lucide-react";

export function ShiftTemplateModal({ isOpen, initialData, branchId, onSave, onClose }) {
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    startTime: "08:30",
    endTime: "15:00",
    maxOvertimeMinutes: 0,
    isActive: true,
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        code: initialData.code || "",
        name: initialData.name || "",
        startTime: initialData.startTime ? initialData.startTime.slice(0, 5) : "08:30",
        endTime: initialData.endTime ? initialData.endTime.slice(0, 5) : "15:00",
        maxOvertimeMinutes: initialData.maxOvertimeMinutes || 0,
        isActive: initialData.isActive !== false,
      });
    }
  }, [initialData]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      ...formData,
      branchId,
      startTime: formData.startTime.length === 5 ? `${formData.startTime}:00` : formData.startTime,
      endTime: formData.endTime.length === 5 ? `${formData.endTime}:00` : formData.endTime,
      maxOvertimeMinutes: Number(formData.maxOvertimeMinutes) || 0,
    };
    onSave({ id: initialData?.id, data: payload });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 flex flex-col">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-pink-50 text-pink-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              {initialData?.id ? "Cập nhật Mẫu Ca làm việc" : "Thêm Mẫu Ca làm việc mới"}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Mã ca làm việc (Viết hoa, duy nhất)
            </label>
            <input
              type="text"
              required
              disabled={!!initialData?.id}
              value={formData.code}
              onChange={(e) => setFormData((p) => ({ ...p, code: e.target.value.toUpperCase() }))}
              placeholder="VD: MORNING, AFTERNOON..."
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500/30 uppercase disabled:bg-slate-50 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Tên hiển thị
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
              placeholder="VD: Ca Sáng, Ca Chiều..."
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500/30"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Giờ bắt đầu
              </label>
              <input
                type="time"
                required
                value={formData.startTime}
                onChange={(e) => setFormData((p) => ({ ...p, startTime: e.target.value }))}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500/30"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Giờ kết thúc
              </label>
              <input
                type="time"
                required
                value={formData.endTime}
                onChange={(e) => setFormData((p) => ({ ...p, endTime: e.target.value }))}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500/30"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Cửa sổ làm thêm tối đa (Phút)
            </label>
            <input
              type="number"
              min="0"
              max="180"
              value={formData.maxOvertimeMinutes}
              onChange={(e) => setFormData((p) => ({ ...p, maxOvertimeMinutes: e.target.value }))}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500/30"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Mặc định 60 phút cho Ca Sáng để cho phép khách làm dịch vụ hoá chất muộn
            </p>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData((p) => ({ ...p, isActive: e.target.checked }))}
              className="w-4 h-4 rounded text-pink-600 focus:ring-pink-500"
            />
            <label htmlFor="isActive" className="text-xs font-medium text-slate-700 cursor-pointer">
              Đang áp dụng tại chi nhánh
            </label>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-xl transition-colors cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold text-white bg-pink-600 hover:bg-pink-700 rounded-xl shadow-md shadow-pink-500/20 transition-all cursor-pointer"
            >
              Lưu mẫu ca
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
