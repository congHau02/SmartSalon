import React from "react";
import { FileText, Sparkles } from "lucide-react";

export function VisualLogNotesForm({
  formulaNotes,
  setFormulaNotes,
  hairConditionNotes,
  setHairConditionNotes,
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Formula Notes */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-sm space-y-2">
        <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
          <FileText className="w-3.5 h-3.5 text-pink-400" />
          <span>Công thức pha chế & Tỉ lệ thuốc</span>
        </label>
        <textarea
          rows={3}
          value={formulaNotes}
          onChange={(e) => setFormulaNotes(e.target.value)}
          placeholder="Ví dụ: 1 phần Bột tẩy Blond Studio + 1.5 phần Oxy 9% (40 Vol), ủ nhiệt 35 phút..."
          className="w-full bg-slate-950/60 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 placeholder:text-slate-400 focus:outline-none focus:border-pink-500 transition-colors"
        />
      </div>

      {/* Hair Condition Notes */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-sm space-y-2">
        <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Tình trạng tóc & Lưu ý kỹ thuật</span>
        </label>
        <textarea
          rows={3}
          value={hairConditionNotes}
          onChange={(e) => setHairConditionNotes(e.target.value)}
          placeholder="Ví dụ: Tóc mảnh đã qua tẩy 1 lần, ngọn yếu xơ, lưu ý không kéo thuốc sát chân tóc..."
          className="w-full bg-slate-950/60 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 placeholder:text-slate-400 focus:outline-none focus:border-pink-500 transition-colors"
        />
      </div>
    </div>
  );
}
