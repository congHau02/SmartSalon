import React from "react";
import { FlaskConical, Plus, Trash2 } from "lucide-react";

export function ServiceBomTable({
  bomFields,
  register,
  errors,
  handleAddBomItem,
  handleProductSelect,
  removeBom,
  masterProducts,
}) {
  return (
    <div className="space-y-4 animate-in fade-in duration-150">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-pink-50/70 border border-pink-200/80 text-xs text-pink-900">
        <div className="flex items-start gap-2.5">
          <FlaskConical className="w-4 h-4 mt-0.5 text-pink-600 shrink-0" />
          <div>
            <span className="font-bold">Định lượng BOM (Bill of Materials):</span>
            <p className="text-pink-800/90 text-[11px] mt-0.5">
              Khi nhân viên hoàn thành dịch vụ trên POS, hệ thống sẽ tự động trừ chính xác
              số ml / gram hoá chất khỏi kho chi nhánh tương ứng.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleAddBomItem}
          className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-pink-600 hover:bg-pink-700 text-white font-semibold text-xs transition-colors shrink-0 cursor-pointer shadow-xs min-h-[44px]"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Thêm vật tư</span>
        </button>
      </div>

      {bomFields.length === 0 ? (
        <div className="text-center py-10 px-4 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center mb-3">
            <FlaskConical className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-slate-800">Chưa cấu hình định mức vật tư</h4>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-4">
            Nếu dịch vụ này có sử dụng dầu gội, thuốc uốn, thuốc nhuộm hoặc oxy, hãy thêm
            vào để kho được cập nhật tự động.
          </p>
          <button
            type="button"
            onClick={handleAddBomItem}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-pink-600 hover:bg-pink-700 text-white font-semibold text-xs shadow-xs cursor-pointer min-h-[44px]"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Thêm vật tư đầu tiên</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {bomFields.map((field, index) => {
            const rowError = errors?.bomList?.[index];
            return (
              <div
                key={field.id}
                className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/90 flex flex-col md:flex-row md:items-center gap-3 transition-all hover:border-slate-300"
              >
                {/* Product Selector */}
                <div className="flex-1 min-w-0">
                  <label
                    htmlFor={`bom-product-${index}`}
                    className="block text-[11px] font-bold text-slate-600 uppercase mb-1"
                  >
                    Sản phẩm vật tư master <span className="text-pink-600">*</span>
                  </label>
                  <select
                    id={`bom-product-${index}`}
                    {...register(`bomList.${index}.productId`, {
                      onChange: (e) => handleProductSelect(index, e.target.value),
                    })}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 focus:border-pink-500 focus:ring-1 focus:ring-pink-500 cursor-pointer"
                  >
                    <option value="">-- Chọn sản phẩm trong danh mục master --</option>
                    {masterProducts.map((prod) => (
                      <option key={prod.id} value={prod.id}>
                        {prod.name} ({prod.sku || "Chưa có SKU"}) - {prod.volumeOrWeightPerUnit}{" "}
                        {prod.volumeUnit || prod.unit}
                      </option>
                    ))}
                  </select>
                  {rowError?.productId && (
                    <p className="mt-1 text-[11px] text-rose-600 font-medium">
                      {rowError.productId.message}
                    </p>
                  )}
                </div>

                {/* Standard Amount */}
                <div className="w-full md:w-36">
                  <label
                    htmlFor={`bom-amount-${index}`}
                    className="block text-[11px] font-bold text-slate-600 uppercase mb-1"
                  >
                    Định mức tiêu hao <span className="text-pink-600">*</span>
                  </label>
                  <input
                    id={`bom-amount-${index}`}
                    type="number"
                    min="0.01"
                    step="0.5"
                    {...register(`bomList.${index}.standardAmount`)}
                    placeholder="30"
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 focus:border-pink-500 focus:ring-1 focus:ring-pink-500"
                  />
                  {rowError?.standardAmount && (
                    <p className="mt-1 text-[11px] text-rose-600 font-medium">
                      {rowError.standardAmount.message}
                    </p>
                  )}
                </div>

                {/* Unit */}
                <div className="w-full md:w-28">
                  <label
                    htmlFor={`bom-unit-${index}`}
                    className="block text-[11px] font-bold text-slate-600 uppercase mb-1"
                  >
                    Đơn vị
                  </label>
                  <input
                    id={`bom-unit-${index}`}
                    type="text"
                    {...register(`bomList.${index}.unit`)}
                    placeholder="ml hoặc g"
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 focus:border-pink-500 focus:ring-1 focus:ring-pink-500"
                  />
                </div>

                {/* Remove Button */}
                <div className="pt-2 md:pt-5 flex justify-end">
                  <button
                    type="button"
                    onClick={() => removeBom(index)}
                    aria-label={`Xóa vật tư dòng ${index + 1}`}
                    className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
                  >
                    <Trash2 className="w-4 h-4" aria-hidden="true" />
                  </button>
                </div>
              </div>
            );
          })}

          <div className="pt-2">
            <button
              type="button"
              onClick={handleAddBomItem}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-pink-600 hover:text-pink-700 cursor-pointer min-h-[44px] py-2 px-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 rounded-lg"
            >
              <Plus className="w-4 h-4" aria-hidden="true" />
              <span>Thêm dòng hoá chất / vật tư khác</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
