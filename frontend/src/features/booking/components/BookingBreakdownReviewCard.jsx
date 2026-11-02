import React, { useMemo } from "react";
import { MapPin, Lock, Loader2, Tag, Check, X } from "lucide-react";
import { formatCurrency } from "../../../lib/utils";
import { MembershipTierBadge } from "../../../components/common/MembershipTierBadge";

export function BookingBreakdownReviewCard({
  bookingSummary,
  voucherState = {},
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
  creditBalance = bookingSummary?.creditBalance || 0,
}) {
  const {
    voucherInput = "",
    setVoucherInput,
    appliedVoucher = null,
    voucherError = null,
    isValidatingVoucher = false,
    onApplyVoucher,
    onRemoveVoucher,
  } = voucherState;

  const tierDiscountAmount = useMemo(
    () => Math.round((Number(totalPrice || 0) * (discountPercent || 0)) / 100),
    [totalPrice, discountPercent]
  );

  const voucherDiscountAmount = useMemo(
    () => Number(appliedVoucher?.discountAmount || 0),
    [appliedVoucher]
  );

  const effectiveEstimatedDiscount = Math.max(tierDiscountAmount, voucherDiscountAmount);
  const finalEstimatedPrice = Math.max(0, Number(totalPrice || 0) - effectiveEstimatedDiscount);
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
                -{formatCurrency(tierDiscountAmount)}
              </span>
            </div>
          )}

          {/* Voucher Input & Applied Display */}
          <div className="pt-2 pb-1 border-t border-slate-100 space-y-2">
            <div className="flex items-center gap-2">
              <Tag className="w-3.5 h-3.5 text-pink-600 shrink-0" />
              {appliedVoucher ? (
                <div className="flex-1 flex items-center justify-between bg-pink-50 border border-pink-200 rounded-lg px-2.5 py-1 text-xs text-pink-800">
                  <div className="flex items-center gap-1.5 font-medium">
                    <span className="text-[11px] text-pink-600">Voucher:</span>
                    <span className="font-mono font-bold text-pink-900 tracking-wider">{appliedVoucher.code}</span>
                  </div>
                  <button
                    type="button"
                    onClick={onRemoveVoucher}
                    className="flex items-center gap-0.5 text-[11px] text-rose-600 hover:text-rose-700 font-semibold cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                    <span>Gỡ</span>
                  </button>
                </div>
              ) : (
                <div className="flex-1 flex gap-1.5">
                  <input
                    type="text"
                    value={voucherInput}
                    onChange={(e) => setVoucherInput && setVoucherInput(e.target.value.toUpperCase())}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        if (onApplyVoucher) onApplyVoucher(voucherInput);
                      }
                    }}
                    placeholder="MÃ GIẢM GIÁ (VD: TET2026)"
                    className="flex-1 bg-white border border-slate-300 rounded-lg px-2.5 py-1 font-mono uppercase text-slate-800 text-xs placeholder:text-slate-400 focus:outline-none focus:border-pink-500"
                  />
                  <button
                    type="button"
                    onClick={() => onApplyVoucher && onApplyVoucher(voucherInput)}
                    disabled={isValidatingVoucher || !voucherInput?.trim()}
                    className="px-3 py-1 rounded-lg bg-pink-600 hover:bg-pink-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-semibold text-xs transition-colors flex items-center gap-1 cursor-pointer disabled:cursor-not-allowed"
                  >
                    {isValidatingVoucher ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                    <span>Áp dụng</span>
                  </button>
                </div>
              )}
            </div>

            {voucherError && (
              <p className="text-[11px] text-rose-600 font-medium pl-5">
                {voucherError}
              </p>
            )}

            {appliedVoucher && (
              <div className="pl-5 space-y-0.5">
                <p className="text-[11px] text-pink-700 font-semibold">
                  Ước tính giảm {formatCurrency(voucherDiscountAmount)} tại salon
                </p>
                <p className="text-[10px] text-slate-400">
                  * Tiền cọc giữ chỗ 20% và mã QR thanh toán không thay đổi.
                </p>
              </div>
            )}
          </div>

          {creditBalance > 0 && (
            <div className="flex items-center justify-between text-emerald-800 bg-emerald-50/80 px-2.5 py-1.5 rounded-lg border border-emerald-200">
              <span className="font-medium">Tiền cọc bảo lưu khả dụng:</span>
              <span className="font-bold">{formatCurrency(creditBalance)}</span>
            </div>
          )}

          <div className="flex items-center justify-between pt-2 border-t border-dashed border-slate-200">
            <div>
              <span className="font-bold text-pink-900 text-sm block">Tiền cọc giữ chỗ (20%):</span>
              <span className="text-[10px] text-slate-400 block">Không giảm trừ bởi voucher</span>
            </div>
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
