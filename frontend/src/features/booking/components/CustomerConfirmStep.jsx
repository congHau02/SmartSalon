import React, { useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  MapPin,
  Calendar,
  Clock,
  Sparkles,
  ShieldCheck,
  User,
  Phone,
  FileText,
  ArrowLeft,
  Loader2,
  Lock,
} from "lucide-react";
import { useAuth } from "../../auth/useAuth";
import { formatCurrency } from "../../../lib/utils";

const guestSchema = z.object({
  customerName: z
    .string()
    .trim()
    .min(2, "Họ và tên phải có ít nhất 2 ký tự")
    .max(100, "Họ và tên không vượt quá 100 ký tự"),
  customerPhone: z
    .string()
    .trim()
    .regex(/^(0[35789])[0-9]{8}$/, "Số điện thoại không hợp lệ (10 chữ số, đầu 03, 05, 07, 08, 09)"),
  notes: z.string().max(500, "Ghi chú không vượt quá 500 ký tự").optional(),
});

export function CustomerConfirmStep({
  branch,
  stylist,
  selectedServices = [],
  selectedDate,
  selectedSlotTime,
  onBack,
  onSubmitBooking,
  isSubmitting = false,
  errorMessage = null,
}) {
  const { user } = useAuth();

  const totalDuration = useMemo(
    () => selectedServices.reduce((sum, s) => sum + (s.durationMinutes || 0), 0),
    [selectedServices]
  );

  const totalPrice = useMemo(
    () => selectedServices.reduce((sum, s) => sum + Number(s.basePrice || 0), 0),
    [selectedServices]
  );

  const depositAmount = useMemo(() => Math.round(totalPrice * 0.2), [totalPrice]);

  // Form setup
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(guestSchema),
    defaultValues: {
      customerName: user?.fullName || "",
      customerPhone: user?.phone || "",
      notes: "",
    },
  });

  const onFormSubmit = (data) => {
    onSubmitBooking({
      customerName: user?.fullName || data.customerName,
      customerPhone: user?.phone || data.customerPhone,
      notes: data.notes || "",
    });
  };

  return (
    <div className="space-y-8">
      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-start gap-2">
          <ShieldCheck className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
          <div>
            <div className="font-bold">Không thể giữ chỗ</div>
            <div>{errorMessage}</div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-8">
        <div className="grid lg:grid-cols-12 gap-8">
          {/* Left Column: Customer Form */}
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
                    <p className="text-xs text-rose-500 mt-1 font-medium">{errors.customerName.message}</p>
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
                    <p className="text-xs text-rose-500 mt-1 font-medium">{errors.customerPhone.message}</p>
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
                <strong>Chính sách giữ chỗ:</strong> Ngay sau khi bấm xác nhận, hệ thống SmartSalon sẽ kích hoạt khoá giữ chỗ độc quyền trong <strong>5 phút</strong> trên Redis. Quý khách vui lòng quét mã VietQR để hoàn tất khoản cọc 20%.
              </div>
            </div>
          </div>

          {/* Right Column: Breakdown Review Card */}
          <div className="lg:col-span-5">
            <div className="bg-white rounded-2xl border-2 border-pink-200 p-6 shadow-sm space-y-5 sticky top-24">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <span className="font-bold text-slate-900 text-base">Tóm tắt lịch hẹn</span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-pink-100 text-pink-700">
                  {selectedServices.length} dịch vụ
                </span>
              </div>

              {/* Branch */}
              <div className="flex items-start gap-2.5 text-xs text-slate-600">
                <MapPin className="w-4 h-4 text-pink-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-slate-900 text-sm">{branch?.name || "Chi nhánh SmartSalon"}</div>
                  <div className="text-slate-500 mt-0.5">{branch?.address}</div>
                </div>
              </div>

              {/* Time & Stylist */}
              <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                <div>
                  <span className="text-slate-400 block mb-0.5">Ngày & Giờ</span>
                  <strong className="text-slate-800 text-sm block">{selectedSlotTime}</strong>
                  <span className="text-slate-500">{selectedDate}</span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Chuyên viên</span>
                  <strong className="text-slate-800 text-sm block truncate">
                    {stylist ? stylist.fullName : "Tự động xếp KTV"}
                  </strong>
                  <span className="text-pink-600 font-medium">
                    {stylist ? "Đã chỉ định" : "Theo lịch trống"}
                  </span>
                </div>
              </div>

              {/* Services List */}
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {selectedServices.map((s) => (
                  <div key={s.id} className="flex items-center justify-between text-xs py-1">
                    <span className="text-slate-700 truncate pr-2">{s.name}</span>
                    <span className="font-semibold text-slate-900 shrink-0">{formatCurrency(s.basePrice)}</span>
                  </div>
                ))}
              </div>

              {/* Duration and Price Breakdown */}
              <div className="pt-4 border-t border-slate-100 space-y-2 text-xs">
                <div className="flex items-center justify-between text-slate-500">
                  <span>Tổng thời lượng:</span>
                  <span className="font-semibold text-slate-800">{totalDuration} phút</span>
                </div>
                <div className="flex items-center justify-between text-slate-500">
                  <span>Tổng chi phí dịch vụ:</span>
                  <span className="font-bold text-slate-900 text-sm">{formatCurrency(totalPrice)}</span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-dashed border-slate-200">
                  <span className="font-bold text-pink-900 text-sm">Tiền cọc giữ chỗ (20%):</span>
                  <span className="font-extrabold text-pink-700 text-lg">{formatCurrency(depositAmount)}</span>
                </div>
              </div>

              {/* Submit CTA */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-pink-500 to-rose-600 text-white shadow-md shadow-pink-200 hover:from-pink-600 hover:to-rose-700 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Đang khoá giữ chỗ 5 phút...</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      <span>Xác nhận & Giữ chỗ 5 phút</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Back button */}
        <div className="pt-4 border-t border-slate-200">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onBack}
            className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-sm hover:bg-slate-50 cursor-pointer flex items-center gap-2 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Quay lại Chọn giờ</span>
          </button>
        </div>
      </form>
    </div>
  );
}
