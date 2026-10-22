import React from "react";
import { X } from "lucide-react";

export function VisualLogImageModal({ previewImage, onClose }) {
  if (!previewImage) return null;

  return (
    <div
      className="fixed inset-0 z-70 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
      onClick={onClose}
    >
      <div className="relative max-w-3xl max-h-[90vh]">
        <img
          src={previewImage}
          alt="Xem ảnh kích thước lớn"
          className="max-h-[85vh] w-auto rounded-2xl object-contain border border-slate-700 shadow-2xl"
        />
        <button
          type="button"
          onClick={onClose}
          className="absolute -top-3 -right-3 p-2 rounded-full bg-slate-800 text-white hover:bg-slate-700 border border-slate-600 shadow-lg cursor-pointer"
          title="Đóng xem ảnh"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
