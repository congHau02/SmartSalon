import React from "react";
import { Camera, Sparkles, Star, Scissors } from "lucide-react";

export function CustomerOrdersTab() {
  return (
    <div className="bg-white rounded-3xl p-8 sm:p-12 border border-pink-100 shadow-sm text-center space-y-4">
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-600 text-white flex items-center justify-center mx-auto shadow-md shadow-pink-200">
        <Camera className="w-8 h-8" />
      </div>

      <div className="space-y-1.5 max-w-md mx-auto">
        <h3 className="text-lg font-extrabold text-slate-900">
          Nhật ký Làm đẹp & Hồ sơ Visual Log
        </h3>
        <p className="text-xs text-slate-500 leading-relaxed">
          Nơi lưu giữ hành trình biến hóa nhan sắc với thư viện ảnh Trước/Sau (Before & After), hồ sơ tình trạng tóc, lời dặn chăm sóc từ stylist và đánh giá chất lượng dịch vụ.
        </p>
      </div>

      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-pink-50 border border-pink-200 text-pink-700 text-xs font-semibold">
        <Sparkles className="w-4 h-4" />
        <span>Hồ sơ kỹ thuật tự động đồng bộ sau khi hóa đơn được thanh toán tại quầy</span>
      </div>
    </div>
  );
}
