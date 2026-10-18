import React from "react";
import { formatCurrency } from "../../../lib/utils";
import { Badge } from "../../../components/ui/Badge";
import { Button } from "../../../components/ui/Button";
import { 
  DollarSign, 
  Receipt, 
  Edit3, 
  Users, 
  Sparkles, 
  Scissors, 
  CheckCircle2, 
  HeartHandshake, 
  Layers,
  ChevronRight
} from "lucide-react";

function getProgressColor(rate, highThreshold = 80, midThreshold = 50) {
  const num = Number(rate) || 0;
  if (num >= highThreshold) return "bg-emerald-500";
  if (num >= midThreshold) return "bg-blue-500";
  if (num > 0) return "bg-amber-500";
  return "bg-slate-300";
}

function getBadgeVariant(rate, highThreshold = 80, midThreshold = 50) {
  const num = Number(rate) || 0;
  if (num >= highThreshold) return "success";
  if (num >= midThreshold) return "pink";
  if (num > 0) return "warning";
  return "default";
}

export function StaffPerformanceTable({
  staffMembers = [],
  onEditBaseSalary,
  onViewCommissionLedgers,
}) {
  if (staffMembers.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/90 p-12 text-center space-y-3 shadow-xs">
        <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
          <Users className="w-7 h-7" />
        </div>
        <h3 className="text-base font-bold text-slate-800">Không tìm thấy dữ liệu nhân sự</h3>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          Không có nhân sự nào hoạt động tại chi nhánh này hoặc phù hợp với bộ lọc hiện tại.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse min-w-[950px]">
          <thead className="bg-slate-50/90 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            <tr>
              <th className="py-3 px-4">Nhân sự</th>
              <th className="py-3 px-4">Lương cứng tháng</th>
              <th className="py-3 px-3 text-center">Đơn / Công đoạn</th>
              <th className="py-3 px-4 text-right">Tổng hoa hồng</th>
              <th className="py-3 px-4 text-right">Tổng thực lĩnh</th>
              <th className="py-3 px-4 min-w-[170px]">Tỷ lệ yêu cầu đích danh</th>
              <th className="py-3 px-4 min-w-[170px]">Tỷ lệ khách quay lại</th>
              <th className="py-3 px-4 text-center">Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {staffMembers.map((staff) => {
              const reqRate = Number(staff.requestedStylistRate) || 0;
              const rebookRate = Number(staff.rebookingRate) || 0;
              const isStylist = staff.roles?.includes("STYLIST");

              return (
                <tr 
                  key={staff.staffId} 
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

                  {/* Base Salary with Edit Trigger */}
                  <td className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-slate-800 text-sm">
                        {formatCurrency(staff.baseSalary)}
                      </span>
                      <button
                        type="button"
                        onClick={() => onEditBaseSalary(staff)}
                        title="Chỉnh sửa lương cứng"
                        className="p-1 rounded-md text-slate-400 hover:text-pink-600 hover:bg-pink-50 transition-colors cursor-pointer"
                        aria-label={`Sửa lương của ${staff.fullName}`}
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <span className="text-[10px] text-slate-400">Lương cố định tháng</span>
                  </td>

                  {/* Completed Orders & Steps */}
                  <td className="py-3.5 px-3 text-center">
                    <div className="font-bold text-slate-900">
                      {staff.completedOrderCount} <span className="text-[11px] font-normal text-slate-500">đơn</span>
                    </div>
                    <div className="text-[11px] text-slate-400 flex items-center justify-center gap-1 mt-0.5">
                      <Layers className="w-3 h-3 text-slate-300" />
                      <span>{staff.completedStepCount} bước</span>
                    </div>
                  </td>

                  {/* Total Commission */}
                  <td className="py-3.5 px-4 text-right">
                    <div className="font-bold text-emerald-600 text-sm">
                      +{formatCurrency(staff.totalCommission)}
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onViewCommissionLedgers(staff);
                      }}
                      className="text-[10px] font-bold text-pink-600 hover:underline mt-0.5 inline-flex items-center gap-0.5 cursor-pointer"
                    >
                      <Receipt className="w-3 h-3" />
                      <span>{staff.commissionLedgers?.length || 0} bút toán</span>
                    </button>
                  </td>

                  {/* Total Payout (Base + Commission) */}
                  <td className="py-3.5 px-4 text-right">
                    <div className="font-black text-slate-900 text-sm">
                      {formatCurrency(staff.totalPayout)}
                    </div>
                    <span className="text-[10px] font-semibold text-slate-400">
                      Lương + Hoa hồng
                    </span>
                  </td>

                  {/* Requested Stylist Rate */}
                  <td className="py-3.5 px-4">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-500 font-medium">Chỉ định:</span>
                        <Badge variant={getBadgeVariant(reqRate, 80, 50)} className="text-[10px] font-bold">
                          {reqRate.toFixed(1)}%
                        </Badge>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${getProgressColor(reqRate, 80, 50)}`}
                          style={{ width: `${Math.min(reqRate, 100)}%` }}
                        />
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {staff.requestedBookingCount} / {staff.completedBookingCount} lịch hẹn
                      </div>
                    </div>
                  </td>

                  {/* Re-booking Rate */}
                  <td className="py-3.5 px-4">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-500 font-medium">Khách quay lại:</span>
                        <Badge variant={getBadgeVariant(rebookRate, 60, 30)} className="text-[10px] font-bold">
                          {rebookRate.toFixed(1)}%
                        </Badge>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${getProgressColor(rebookRate, 60, 30)}`}
                          style={{ width: `${Math.min(rebookRate, 100)}%` }}
                        />
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {staff.repeatCustomerCount} / {staff.totalIdentifiedCustomers} khách (≥2 đơn)
                      </div>
                    </div>
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
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
