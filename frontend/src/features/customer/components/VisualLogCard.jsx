import React from "react";
import { Camera, Sparkles, FileText, Image as ImageIcon } from "lucide-react";

export function VisualLogCard({ visualLog }) {
  if (!visualLog) return null;

  const hasPhotos = Boolean(visualLog.beforeImageUrl || visualLog.afterImageUrl);

  return (
    <div className="rounded-2xl border border-pink-100 bg-pink-50/30 p-4 space-y-3.5">
      <div className="flex items-center justify-between text-xs font-bold text-pink-700">
        <span className="flex items-center gap-1.5">
          <Camera className="w-4 h-4 text-pink-500" />
          <span>Hồ sơ Visual Log (Biến hóa Trước / Sau)</span>
        </span>
        <span className="text-[10px] text-slate-400 font-medium">Bảo mật công thức</span>
      </div>

      {hasPhotos && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Before Photo */}
          <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-100 aspect-4/3 flex items-center justify-center">
            {visualLog.beforeImageUrl ? (
              <>
                <img
                  src={visualLog.beforeImageUrl}
                  alt="Ảnh trước dịch vụ"
                  className="w-full h-full object-cover"
                />
                <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md text-[10px] font-black bg-slate-900/70 text-white tracking-wider backdrop-blur-xs">
                  TRƯỚC
                </span>
              </>
            ) : (
              <div className="text-center text-slate-400 text-xs p-3">
                <ImageIcon className="w-6 h-6 mx-auto mb-1 opacity-50" />
                <span>Không có ảnh trước</span>
              </div>
            )}
          </div>

          {/* After Photo */}
          <div className="relative rounded-xl overflow-hidden border border-pink-200 bg-slate-100 aspect-4/3 flex items-center justify-center">
            {visualLog.afterImageUrl ? (
              <>
                <img
                  src={visualLog.afterImageUrl}
                  alt="Ảnh sau khi hoàn thiện"
                  className="w-full h-full object-cover"
                />
                <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md text-[10px] font-black bg-pink-600/90 text-white tracking-wider backdrop-blur-xs">
                  HOÀN THIỆN
                </span>
              </>
            ) : (
              <div className="text-center text-slate-400 text-xs p-3">
                <ImageIcon className="w-6 h-6 mx-auto mb-1 opacity-50" />
                <span>Không có ảnh sau</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Notes */}
      <div className="grid sm:grid-cols-2 gap-2.5 text-xs">
        {visualLog.hairConditionNotes && (
          <div className="bg-white/80 rounded-xl p-2.5 border border-pink-100 space-y-1">
            <span className="font-bold text-slate-700 flex items-center gap-1 text-[11px]">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Tình trạng tóc ban đầu
            </span>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              {visualLog.hairConditionNotes}
            </p>
          </div>
        )}

        {visualLog.formulaNotes && (
          <div className="bg-white/80 rounded-xl p-2.5 border border-pink-100 space-y-1">
            <span className="font-bold text-slate-700 flex items-center gap-1 text-[11px]">
              <FileText className="w-3.5 h-3.5 text-pink-500" /> Lời dặn & Công nghệ thực hiện
            </span>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              {visualLog.formulaNotes}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
