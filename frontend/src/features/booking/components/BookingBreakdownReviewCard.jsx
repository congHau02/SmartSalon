import React, { useMemo } from "react";
import { MapPin, Lock, Loader2 } from "lucide-react";
import { formatCurrency } from "../../../lib/utils";
import { MembershipTierBadge } from "../../../components/common/MembershipTierBadge";

export function BookingBreakdownReviewCard({
  bookingSummary,
  isSubmitting,
  // Graceful fallbacks for legacy prop shape
  branch = bookingSummary?.branch,
  stylist = bookingSummary?.stylist,
  selectedServices = bookingSummary?.selectedServices || [],
  selectedDate = bookingSummary?.selectedDate,
  selectedSlotTime = bookingSummary?.selectedSlotTime,
  totalDuration = bookingSummary?.totalDuration,
  totalPrice = bookingSummary?.totalPrice,
  depositAmount = bookingSummary?.depositAmount,
  membershipTier = bookingSummary?.membershipTier || "STANDARD",
  discountPercent = bookingSummary?.discountPercent || 0,
}) {
  const discountAmount = useMemo(
    () => Math.round((Number(totalPrice || 0) * (discountPercent || 0)) / 100),
    [totalPrice, discountPercent]
  );
  const finalEstimatedPrice = Math.max(0, Number(totalPrice || 0) - discountAmount);
  const remainingAtSalon = Math.max(0, finalEstimatedPrice - Number(depositAmount || 0));

  return (
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
            <div className="font-bold text-slate-900 text-sm">
              {branch?.name || "Chi nhánh SmartSalon"}
            </div>
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
              <span className="font-semibold text-slate-900 shrink-0">
                {formatCurrency(s.basePrice)}
              </span>
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
            <span className="font-bold text-slate-900 text-sm">
              {formatCurrency(totalPrice)}
            </span>
          </div>

          {discountPercent > 0 && (
            <div className="flex items-center justify-between text-emerald-800 bg-emerald-50/80 px-2.5 py-1.5 rounded-lg border border-emerald-200">
              <span className="flex items-center gap-1.5 font-medium">
                <span>Ưu đãi thành viên</span>
                <MembershipTierBadge tier={membershipTier} size="xs" />
                <span>(-{discountPercent}%):</span>
              </span>
              <span className="font-bold">
                -{formatCurrency(discountAmount)}
              </span>
            </div>
          )}

          <div className="flex items-center justify-between pt-2 border-t border-dashed border-slate-200">
            <span className="font-bold text-pink-900 text-sm">Tiền cọc giữ chỗ (20%):</span>
            <span className="font-extrabold text-pink-700 text-lg">
              {formatCurrency(depositAmount)}
            </span>
          </div>

          <div className="flex items-center justify-between pt-1 text-slate-600 text-xs">
            <span>Dự kiến thanh toán tại salon:</span>
            <span className="font-bold text-slate-900">
              {formatCurrency(remainingAtSalon)}
            </span>
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
  );
}
