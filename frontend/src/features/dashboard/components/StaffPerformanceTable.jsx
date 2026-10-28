import React from "react";
import { Users } from "lucide-react";
import { StaffPerformanceRow } from "./StaffPerformanceRow";

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
        <table className="w-full text-left text-xs border-collapse min-w-[1050px]">
          <thead className="bg-slate-50/90 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            <tr>
              <th className="py-3 px-4">Nhân sự</th>
              <th className="py-3 px-4">Lương cơ bản</th>
              <th className="py-3 px-3 text-center">Ca trực</th>
              <th className="py-3 px-3 text-center">Đơn / Công đoạn</th>
              <th className="py-3 px-4 text-right">Tổng hoa hồng</th>
              <th className="py-3 px-4 text-right">Tổng thực lĩnh</th>
              <th className="py-3 px-3 text-center">Đánh giá TB (★)</th>
              <th className="py-3 px-4 min-w-[160px]">Tỷ lệ yêu cầu đích danh</th>
              <th className="py-3 px-4 min-w-[160px]">Tỷ lệ khách quay lại</th>
              <th className="py-3 px-4 text-center">Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {staffMembers.map((staff) => (
              <StaffPerformanceRow
                key={staff.staffId}
                staff={staff}
                onEditBaseSalary={onEditBaseSalary}
                onViewCommissionLedgers={onViewCommissionLedgers}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
