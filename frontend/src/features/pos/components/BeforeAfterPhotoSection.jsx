import React, { useRef } from "react";
import { Camera, Trash2, Eye, Upload, Loader2 } from "lucide-react";

export function BeforeAfterPhotoSection({
  photos,
  onFileUpload,
  onPreviewImage,
  // Graceful fallbacks for legacy prop shape
  beforeImageUrl = photos?.beforeImageUrl,
  setBeforeImageUrl = photos?.setBeforeImageUrl,
  afterImageUrl = photos?.afterImageUrl,
  setAfterImageUrl = photos?.setAfterImageUrl,
  isUploadingBefore = photos?.isUploadingBefore,
  isUploadingAfter = photos?.isUploadingAfter,
}) {
  const beforeFileInputRef = useRef(null);
  const afterFileInputRef = useRef(null);

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-sm space-y-3">
      <div className="flex items-center gap-2">
        <Camera className="w-4 h-4 text-pink-400" />
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
          Hình ảnh kết quả kỹ thuật (Trước & Sau khi làm)
        </h4>
      </div>

      {/* Hidden native file inputs */}
      <input
        ref={beforeFileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        className="hidden"
        onChange={(e) => onFileUpload(e, "before")}
      />
      <input
        ref={afterFileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        className="hidden"
        onChange={(e) => onFileUpload(e, "after")}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Card: Before Image */}
        <div className="border border-slate-800 rounded-xl p-3 bg-slate-950/40 space-y-2.5">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-slate-400" />
              Ảnh Trước khi làm (Before)
            </span>
            {beforeImageUrl && (
              <button
                type="button"
                onClick={() => setBeforeImageUrl("")}
                className="text-slate-400 hover:text-rose-400 transition cursor-pointer"
                title="Xóa ảnh Trước"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {beforeImageUrl ? (
            <div className="relative group rounded-xl overflow-hidden aspect-video bg-slate-900 border border-slate-800">
              <img
                src={beforeImageUrl}
                alt="Ảnh trước khi làm"
                className="w-full h-full object-cover transition duration-300 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => onPreviewImage(beforeImageUrl)}
                  className="p-2 rounded-lg bg-slate-800/90 text-white hover:bg-slate-700 transition cursor-pointer"
                  title="Xem ảnh lớn"
                >
                  <Eye className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => beforeFileInputRef.current?.click()}
                  className="p-2 rounded-lg bg-pink-600 text-white hover:bg-pink-500 transition cursor-pointer"
                  title="Thay đổi ảnh"
                >
                  <Upload className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div
              onClick={() => !isUploadingBefore && beforeFileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-800 hover:border-pink-500/50 rounded-xl aspect-video flex flex-col items-center justify-center p-4 text-center cursor-pointer transition-colors group"
            >
              {isUploadingBefore ? (
                <div className="flex flex-col items-center gap-2 text-pink-400">
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span className="text-xs">Đang tải ảnh lên...</span>
                </div>
              ) : (
                <>
                  <Camera className="w-8 h-8 text-slate-400 group-hover:text-pink-400 transition-colors mb-2" />
                  <span className="text-xs font-semibold text-slate-300 group-hover:text-pink-300">
                    Tải ảnh Trước (Before)
                  </span>
                  <span className="text-[11px] text-slate-400 mt-1">PNG, JPG, WebP tối đa 10MB</span>
                </>
              )}
            </div>
          )}
        </div>

        {/* Card: After Image */}
        <div className="border border-slate-800 rounded-xl p-3 bg-slate-950/40 space-y-2.5">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              Ảnh Sau khi hoàn thành (After)
            </span>
            {afterImageUrl && (
              <button
                type="button"
                onClick={() => setAfterImageUrl("")}
                className="text-slate-400 hover:text-rose-400 transition cursor-pointer"
                title="Xóa ảnh Sau"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {afterImageUrl ? (
            <div className="relative group rounded-xl overflow-hidden aspect-video bg-slate-900 border border-slate-800">
              <img
                src={afterImageUrl}
                alt="Ảnh sau khi hoàn thành"
                className="w-full h-full object-cover transition duration-300 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => onPreviewImage(afterImageUrl)}
                  className="p-2 rounded-lg bg-slate-800/90 text-white hover:bg-slate-700 transition cursor-pointer"
                  title="Xem ảnh lớn"
                >
                  <Eye className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => afterFileInputRef.current?.click()}
                  className="p-2 rounded-lg bg-pink-600 text-white hover:bg-pink-500 transition cursor-pointer"
                  title="Thay đổi ảnh"
                >
                  <Upload className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div
              role="button"
              tabIndex={0}
              aria-label="Tải ảnh sau lên"
              onKeyDown={(e) => {
                if ((e.key === "Enter" || e.key === " ") && !isUploadingAfter) {
                  e.preventDefault();
                  afterFileInputRef.current?.click();
                }
              }}
              onClick={() => !isUploadingAfter && afterFileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-800 hover:border-pink-500/50 rounded-xl aspect-video flex flex-col items-center justify-center p-4 text-center cursor-pointer transition-colors group"
            >
              {isUploadingAfter ? (
                <div className="flex flex-col items-center gap-2 text-pink-400">
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span className="text-xs">Đang tải ảnh lên...</span>
                </div>
              ) : (
                <>
                  <Camera className="w-8 h-8 text-slate-400 group-hover:text-emerald-400 transition-colors mb-2" />
                  <span className="text-xs font-semibold text-slate-300 group-hover:text-emerald-300">
                    Tải ảnh Sau (After)
                  </span>
                  <span className="text-[11px] text-slate-400 mt-1">PNG, JPG, WebP tối đa 10MB</span>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
