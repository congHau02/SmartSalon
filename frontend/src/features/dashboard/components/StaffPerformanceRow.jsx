import React from "react";
import { formatCurrency } from "../../../lib/utils";
import { Button } from "../../../components/ui/Button";
import { RateProgressBar } from "./RateProgressBar";
import { Receipt, Edit3, Scissors, Star } from "lucide-react";

export function StaffPerformanceRow({ staff, onEditBaseSalary, onViewCommissionLedgers }) {
  const reqRate = Number(staff.requestedStylistRate) || 0;
  const rebookRate = Number(staff.rebookingRate) || 0;
  const avgRating = Number(staff.averageRating) || 0;
  const reviewCount = Number(staff.reviewCount) || 0;
  const isStylist = staff.roles?.includes("STYLIST");

  return (
          <tr 
            className="hover:bg-slate-50/70 transition-colors cursor-pointer group"
            onClick={() => onViewCommissionLedgers(staff)}
          >
            {/* Staff Info */}
            <td className="py-3.5 px-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-linear-to-br from-pink-100 to-purple-100 text-pink-700 font-black text-sm flex items-center justify-center shrink-0 border border-pink-200/50">
                  {staff.fullName ? staff.fullName.charAt(0).toUpperCase() : "NV"}
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-slate-900 group-hover:text-pink-600 transition-colors flex items-center gap-1.5">
                    <span className="truncate">{staff.fullName}</span>
                    {isStylist && (
                      <span title="Thợ tạo kiểu tóc chính (Stylist)">
                        <Scissors className="w-3 h-3 text-pink-500 shrink-0" />
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1.5 flex-wrap">
                    <span>@{staff.username}</span>
                    <span>•</span>
                    <span className="font-semibold text-slate-600">
                      {staff.roles?.join(", ") || "STAFF"}
                    </span>
                  </div>
                </div>
              </div>
            </td>

            {/* Base Salary */}
            <td className="py-3.5 px-4 font-mono font-bold text-slate-700">
              <div>{formatCurrency(staff.baseSalary || 0)}</div>
              {staff.contractBaseSalary != null && (
                <div className="text-[10px] text-slate-400 font-normal">
                  HĐ: {formatCurrency(staff.contractBaseSalary)}
                </div>
              )}
            </td>

            {/* Shift Attendance */}
            <td className="py-3.5 px-3 text-center">
              <div className="inline-flex flex-col items-center">
                <span className="font-mono font-semibold text-slate-800 text-xs">
                  {staff.completedShiftCount || 0} / {staff.scheduledShiftCount || 0} ca
                </span>
                {staff.extraShiftCount > 0 && (
                  <span className="text-[10px] text-emerald-600 font-medium">
                    +{staff.extraShiftCount} ca ngoài
                  </span>
                )}
              </div>
            </td>

            {/* Orders & Steps */}
            <td className="py-3.5 px-3 text-center">
              <div className="inline-flex items-center gap-1 font-mono font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md">
                <span>{staff.completedOrderCount}</span>
                <span className="text-slate-400">/</span>
                <span className="text-purple-700">{staff.completedStepCount}</span>
              </div>
            </td>

            {/* Total Commission */}
            <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-600">
              <div>+{formatCurrency(staff.totalCommission || 0)}</div>
              {staff.overtimeCommissionTotal > 0 && (
                <div className="text-[10px] text-amber-600 font-medium">
                  Tăng ca: +{formatCurrency(staff.overtimeCommissionTotal)}
                </div>
              )}
            </td>

            {/* Total Payout */}
            <td className="py-3.5 px-4 text-right font-mono font-black text-slate-900 text-sm">
              {formatCurrency(staff.totalPayout || 0)}
            </td>

            {/* Star Rating & Review Count */}
            <td className="py-3.5 px-3 text-center">
              {avgRating > 0 ? (
                <div className="inline-flex flex-col items-center">
                  <span className="font-bold text-amber-600 flex items-center gap-1 text-xs">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span>{avgRating.toFixed(1)}</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-normal">
                    {reviewCount} đánh giá
                  </span>
                </div>
              ) : (
                <span className="text-slate-300 text-xs">-</span>
              )}
            </td>

            {/* Requested Stylist Rate */}
            <td className="py-3.5 px-4">
              <RateProgressBar
                rate={reqRate}
                label="Đích danh"
                detail={`${staff.requestedBookingCount} / ${staff.completedBookingCount} lịch hẹn`}
                high={80}
                mid={50}
              />
            </td>

            {/* Re-booking Rate */}
            <td className="py-3.5 px-4">
              <RateProgressBar
                rate={rebookRate}
                label="Khách quay lại"
                detail={`${staff.repeatCustomerCount} / ${staff.totalIdentifiedCustomers} khách (≥2 đơn)`}
                high={60}
                mid={30}
              />
            </td>

            {/* Action Buttons */}
            <td className="py-3.5 px-4 text-center" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-center gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onViewCommissionLedgers(staff)}
                  title="Xem sổ cái hoa hồng"
                  className="text-[11px] font-bold h-7 px-2.5 gap-1 text-slate-700 hover:text-pink-600"
                >
                  <Receipt className="w-3 h-3" /> Sổ cái
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => onEditBaseSalary(staff)}
                  title="Chỉnh sửa lương cứng"
                  className="text-[11px] font-bold h-7 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700"
                >
                  <Edit3 className="w-3 h-3" />
                </Button>
              </div>
            </td>
          </tr>
  );
}
