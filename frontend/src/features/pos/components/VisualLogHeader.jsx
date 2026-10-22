import React from "react";
import { User, Sparkles } from "lucide-react";

export function VisualLogHeader({ technicianId, setTechnicianId, stylists = [] }) {
  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-pink-400" />
          <h3 className="text-sm font-bold text-white">Visual Log & Định mức hóa chất thực tế</h3>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          Ghi nhận chính xác lượng thuốc tiêu hao thực tế và hình ảnh kết quả trước/sau dịch vụ.
        </p>
      </div>

      <div className="flex items-center gap-2">
        <User className="w-4 h-4 text-slate-400 shrink-0" />
        <select
          value={technicianId}
          onChange={(e) => setTechnicianId(e.target.value)}
          className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-pink-500"
        >
          <option value="">-- Kỹ thuật viên chính --</option>
          {stylists.map((st) => (
            <option key={st.stylistId || st.id} value={st.stylistId || st.id}>
              {st.fullName || st.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
