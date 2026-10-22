import React from "react";
import { Package, Barcode, Edit2, Trash2 } from "lucide-react";
import { formatCurrency } from "../../../../lib/utils";

export function ProductsTable({
  filteredProducts,
  allCount,
  onToggleStatus,
  onEditProduct,
  onDeleteProduct,
}) {
  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <th scope="col" className="py-3.5 px-4 sm:px-6">Sản phẩm / Vật tư</th>
              <th scope="col" className="py-3.5 px-4">Mã SKU & Barcode</th>
              <th scope="col" className="py-3.5 px-4">Quy cách & Thể tích chuẩn</th>
              <th scope="col" className="py-3.5 px-4">Giá vốn / Giá bán</th>
              <th scope="col" className="py-3.5 px-4">Ngưỡng báo thiếu</th>
              <th scope="col" className="py-3.5 px-4 text-center">Trạng thái</th>
              <th scope="col" className="py-3.5 px-4 sm:px-6 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {filteredProducts.map((product) => {
              const isActive = product.isActive !== false;
              return (
                <tr key={product.id} className="hover:bg-slate-50/80 transition-colors group">
                  <td className="py-4 px-4 sm:px-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-100 font-bold">
                        <Package className="w-5 h-5" aria-hidden="true" />
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 group-hover:text-amber-600 transition-colors">
                          {product.name}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">ID: #{product.id}</div>
                      </div>
                    </div>
                  </td>

                  <td className="py-4 px-4">
                    <div className="space-y-1">
                      <span className="inline-block px-2 py-0.5 rounded-md font-mono text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                        {product.sku}
                      </span>
                      {product.barcode && (
                        <div className="flex items-center gap-1 text-[11px] font-mono text-slate-500">
                          <Barcode className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
                          <span>{product.barcode}</span>
                        </div>
                      )}
                    </div>
                  </td>

                  <td className="py-4 px-4">
                    <div className="space-y-0.5">
                      <span className="font-semibold text-slate-800">1 {product.unit}</span>
                      <div className="text-[11px] text-amber-700 font-medium">
                        {product.volumeOrWeightPerUnit} {product.volumeUnit}
                      </div>
                    </div>
                  </td>

                  <td className="py-4 px-4">
                    <div className="space-y-0.5">
                      <div className="font-bold text-slate-900">
                        {formatCurrency(product.retailPrice)}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Vốn: {formatCurrency(product.costPrice)}
                      </div>
                    </div>
                  </td>

                  <td className="py-4 px-4">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                      &le; {product.minStockAlertUnits ?? 5} {product.unit}
                    </span>
                  </td>

                  <td className="py-4 px-4 text-center">
                    <button
                      type="button"
                      onClick={() => onToggleStatus(product)}
                      className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center cursor-pointer"
                      title={isActive ? "Nhấn để ngừng kinh doanh" : "Nhấn để kích hoạt"}
                      aria-label={`Trạng thái: ${isActive ? "Đang kinh doanh" : "Ngừng kinh doanh"}`}
                    >
                      <span
                        className={`px-2.5 py-1 rounded-full text-[11px] font-bold border transition-colors ${
                          isActive
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                            : "bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200"
                        }`}
                      >
                        {isActive ? "Kinh doanh" : "Ngừng"}
                      </span>
                    </button>
                  </td>

                  <td className="py-4 px-4 sm:px-6 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => onEditProduct(product)}
                        className="min-h-[44px] min-w-[44px] p-2 rounded-xl text-slate-500 hover:text-amber-600 hover:bg-amber-50 transition-colors cursor-pointer flex items-center justify-center focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-amber-500"
                        aria-label={`Chỉnh sửa mặt hàng ${product.name}`}
                      >
                        <Edit2 className="w-4 h-4" aria-hidden="true" />
                      </button>

                      <button
                        type="button"
                        onClick={() => onDeleteProduct(product)}
                        className="min-h-[44px] min-w-[44px] p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer flex items-center justify-center focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-rose-500"
                        aria-label={`Xóa mặt hàng ${product.name}`}
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

      <div className="p-4 bg-slate-50/60 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <span>
          Hiển thị <strong>{filteredProducts.length}</strong> trên tổng số{" "}
          <strong>{allCount}</strong> mặt hàng
        </span>
        <span className="text-slate-400">
          Quy chuẩn đóng gói & định lượng áp dụng toàn chuỗi
        </span>
      </div>
    </>
  );
}
