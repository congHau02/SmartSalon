import React from "react";
import { ShieldCheck, Phone, User, FileText, Lock } from "lucide-react";

export function CustomerInfoForm({ user, register, errors }) {
  return (
    <div className="lg:col-span-7 space-y-6">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-7 h-7 rounded-lg bg-pink-100 text-pink-700 flex items-center justify-center font-bold text-sm">
          1
        </div>
        <h3 className="font-bold text-slate-900 text-lg">Thông tin khách hàng</h3>
      </div>

      {user ? (
        <div className="p-4 rounded-2xl bg-pink-50/60 border border-pink-200 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-pink-700 uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4" />
            <span>Tài khoản thành viên SmartSalon</span>
          </div>
          <div className="text-slate-900 font-bold text-base">{user.fullName}</div>
          <div className="text-xs text-slate-600 flex items-center gap-1.5">
            <Phone className="w-3.5 h-3.5 text-slate-400" />
            <span>{user.phone}</span>
          </div>
        </div>
      ) : (
        <div className="space-y-4 bg-white p-5 rounded-2xl border border-slate-200">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Họ và tên của bạn <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Nguyễn Văn A"
                {...register("customerName")}
                className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm transition-all focus:outline-none ${
                  errors.customerName
                    ? "border-rose-400 focus:ring-2 focus:ring-rose-200"
                    : "border-slate-300 focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
                }`}
              />
            </div>
            {errors.customerName && (
              <p className="text-xs text-rose-500 mt-1 font-medium">
                {errors.customerName.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Số điện thoại nhận tin <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="tel"
                placeholder="0912345678"
                {...register("customerPhone")}
                className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm transition-all focus:outline-none ${
                  errors.customerPhone
                    ? "border-rose-400 focus:ring-2 focus:ring-rose-200"
                    : "border-slate-300 focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
                }`}
              />
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Dùng để tra cứu lịch hẹn và tự động tạo tài khoản khách hàng nếu chưa có.
            </p>
            {errors.customerPhone && (
              <p className="text-xs text-rose-500 mt-1 font-medium">
                {errors.customerPhone.message}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Notes */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200">
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
          Yêu cầu thêm hoặc lưu ý đặc biệt (Tùy chọn)
        </label>
        <div className="relative">
          <FileText className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <textarea
            rows={3}
            placeholder="Ví dụ: Da đầu nhạy cảm, muốn chuyên viên cắt kiểu layer ngắn, v.v."
            {...register("notes")}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm transition-all focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100 resize-none"
          />
        </div>
        {errors.notes && (
          <p className="text-xs text-rose-500 mt-1 font-medium">{errors.notes.message}</p>
        )}
      </div>

      {/* 5-minute hold notice */}
      <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 text-amber-800 text-xs flex items-start gap-2.5 leading-relaxed">
        <Lock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <strong>Chính sách giữ chỗ:</strong> Ngay sau khi bấm xác nhận, hệ thống SmartSalon
          sẽ kích hoạt khoá giữ chỗ độc quyền trong <strong>5 phút</strong> trên Redis. Quý
          khách vui lòng quét mã VietQR để hoàn tất khoản cọc 20%.
        </div>
      </div>
    </div>
  );
}
