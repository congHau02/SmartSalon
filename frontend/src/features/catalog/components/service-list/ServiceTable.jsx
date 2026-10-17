import React from "react";
import { Clock, FlaskConical, Layers, Edit2, Trash2 } from "lucide-react";
import { formatCurrency } from "../../../../lib/utils";

function getCategoryBadgeClass(category) {
  switch (category) {
    case "Cắt tóc & Tạo kiểu":
      return "bg-amber-50 text-amber-800 border-amber-200/80";
    case "Uốn - Nhuộm":
      return "bg-purple-50 text-purple-800 border-purple-200/80";
    case "Gội dưỡng sinh & Spa":
      return "bg-emerald-50 text-emerald-800 border-emerald-200/80";
    case "Phục hồi":
      return "bg-rose-50 text-rose-800 border-rose-200/80";
    default:
      return "bg-slate-100 text-slate-700 border-slate-200";
  }
}

export function ServiceTable({
  filteredServices,
  handleToggleActive,
  handleOpenEditModal,
  setDeletingService,
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50/60 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            <th className="py-3.5 pl-6 pr-4">Tên dịch vụ</th>
            <th className="py-3.5 px-4">Nhóm danh mục</th>
            <th className="py-3.5 px-4">Thời lượng</th>
            <th className="py-3.5 px-4">Giá niêm yết</th>
            <th className="py-3.5 px-4">Định mức BOM</th>
            <th className="py-3.5 px-4">Bước kỹ thuật & Hoa hồng</th>
            <th className="py-3.5 px-4 text-center">Trạng thái</th>
            <th className="py-3.5 pl-4 pr-6 text-right">Thao tác</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
          {filteredServices.map((service) => {
            const bomCount = service.bomList?.length || 0;
            const stepCount = service.defaultSteps?.length || 0;
            const totalRate = (service.defaultSteps || []).reduce(
              (sum, s) => sum + (parseFloat(s.commissionRate) || 0),
              0
            );
            const isServiceActive = service.isActive !== false;

            return (
              <tr
                key={service.id}
                className="hover:bg-slate-50/70 transition-colors group"
              >
                {/* Name & Description */}
                <td className="py-4 pl-6 pr-4">
                  <div className="font-bold text-slate-900 group-hover:text-pink-600 transition-colors">
                    {service.name}
                  </div>
                  {service.description && (
                    <p className="text-[11px] text-slate-400 line-clamp-1 max-w-xs mt-0.5">
                      {service.description}
                    </p>
                  )}
                </td>

                {/* Category */}
                <td className="py-4 px-4">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.8 rounded-lg text-[11px] font-bold border ${getCategoryBadgeClass(
                      service.category
                    )}`}
                  >
                    {service.category}
                  </span>
                </td>

                {/* Duration */}
                <td className="py-4 px-4">
                  <div className="flex items-center gap-1.5 text-slate-600 font-medium">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{service.durationMinutes} phút</span>
                  </div>
                </td>

                {/* Base Price */}
                <td className="py-4 px-4">
                  <span className="font-bold text-slate-900 text-sm">
                    {formatCurrency(service.basePrice)}
                  </span>
                </td>

                {/* BOM Formula */}
                <td className="py-4 px-4">
                  {bomCount > 0 ? (
                    <div
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-pink-50/80 text-pink-700 border border-pink-200/60 font-semibold text-[11px]"
                      title={service.bomList
                        ?.map((b) => `${b.productName}: ${b.standardAmount}${b.unit}`)
                        .join(", ")}
                    >
                      <FlaskConical className="w-3.5 h-3.5 text-pink-600" />
                      <span>{bomCount} hoá chất</span>
                    </div>
                  ) : (
                    <span className="text-[11px] text-slate-400 italic">Chưa cấu hình</span>
                  )}
                </td>

                {/* Steps & Commission */}
                <td className="py-4 px-4">
                  {stepCount > 0 ? (
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-semibold text-[11px]">
                      <Layers className="w-3.5 h-3.5 text-slate-500" />
                      <span>
                        {stepCount} bước ({totalRate}%)
                      </span>
                    </div>
                  ) : (
                    <span className="text-[11px] text-slate-400 italic">Chưa tạo bước</span>
                  )}
                </td>

                {/* Active Status Switch */}
                <td className="py-4 px-4 text-center">
                  <button
                    type="button"
                    onClick={(e) => handleToggleActive(service, e)}
                    title={isServiceActive ? "Bấm để tạm ngưng" : "Bấm để mở lại"}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold cursor-pointer transition-all min-h-[44px] min-w-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 ${
                      isServiceActive
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200/80 hover:bg-emerald-100"
                        : "bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-200"
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isServiceActive ? "bg-emerald-500" : "bg-slate-400"
                      }`}
                    />
                    <span>{isServiceActive ? "Kinh doanh" : "Tạm ngưng"}</span>
                  </button>
                </td>

                {/* Actions */}
                <td className="py-4 pl-4 pr-6 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(service)}
                      aria-label={`Chỉnh sửa ${service.name}`}
                      className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500"
                      title="Chỉnh sửa dịch vụ & BOM"
                    >
                      <Edit2 className="w-4 h-4" aria-hidden="true" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setDeletingService(service)}
                      aria-label={`Xóa ${service.name}`}
                      className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
                      title="Xóa dịch vụ"
                    >
                      <Trash2 className="w-4 h-4" aria-hidden="true" />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
