import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X, Loader2 } from "lucide-react";
import { voucherFormSchema } from "../voucher.schema";
import { VOUCHER_TYPES, DEFAULT_VOUCHER_VALUES } from "../voucher.constants";

export function VoucherFormModal({
  isOpen,
  onClose,
  onSubmit,
  initialData = null,
  branches = [],
  isSubmitting = false,
}) {
  const isEditing = Boolean(initialData);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(voucherFormSchema),
    defaultValues: DEFAULT_VOUCHER_VALUES,
  });

  const selectedType = watch("type");
  const selectedBranchIds = watch("branchIds") || [];

  useEffect(() => {
    if (initialData) {
      reset({
        code: initialData.code || "",
        name: initialData.name || "",
        description: initialData.description || "",
        type: initialData.type || "FIXED",
        value: initialData.value || 0,
        maxDiscount: initialData.maxDiscount || "",
        minOrderAmount: initialData.minOrderAmount || 0,
        startsAt: initialData.startsAt ? initialData.startsAt.substring(0, 16) : "",
        endsAt: initialData.endsAt ? initialData.endsAt.substring(0, 16) : "",
        usageLimit: initialData.usageLimit || "",
        perCustomerLimit: initialData.perCustomerLimit || 1,
        branchIds: initialData.branchIds ? Array.from(initialData.branchIds) : [],
      });
    } else {
      reset(DEFAULT_VOUCHER_VALUES);
    }
  }, [initialData, isOpen, reset]);

  if (!isOpen) return null;

  const handleBranchToggle = (branchId) => {
    const current = new Set(selectedBranchIds);
    if (current.has(branchId)) {
      current.delete(branchId);
    } else {
      current.add(branchId);
    }
    setValue("branchIds", Array.from(current));
  };

  const handleFormSubmit = (data) => {
    const payload = {
      ...data,
      code: data.code.trim().toUpperCase(),
      maxDiscount: data.maxDiscount ? Number(data.maxDiscount) : null,
      usageLimit: data.usageLimit ? Number(data.usageLimit) : null,
      startsAt: data.startsAt ? new Date(data.startsAt).toISOString() : null,
      endsAt: data.endsAt ? new Date(data.endsAt).toISOString() : null,
    };
    onSubmit(payload);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-lg border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 className="font-bold text-slate-900 text-sm">
            {isEditing ? "Chỉnh sửa mã giảm giá" : "Tạo mã giảm giá mới"}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
          <div>
            <label className="font-semibold text-slate-700 block mb-1">Mã voucher (In hoa, không dấu) *</label>
            <input
              {...register("code")}
              disabled={isEditing}
              placeholder="VD: GIAM50K, TET2026"
              className="w-full px-3 py-2 uppercase font-mono rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 disabled:bg-slate-100"
            />
            {errors.code && <p className="text-rose-500 text-[11px] mt-1">{errors.code.message}</p>}
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Tên chương trình khuyến mãi</label>
            <input
              {...register("name")}
              placeholder="VD: Khuyến mãi mùa lễ hội"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Loại giảm giá *</label>
              <select
                {...register("type")}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500"
              >
                {VOUCHER_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                {selectedType === "PERCENT" ? "Tỷ lệ giảm (%) *" : "Số tiền giảm (VNĐ) *"}
              </label>
              <input
                type="number"
                step="any"
                {...register("value")}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 font-mono"
              />
              {errors.value && <p className="text-rose-500 text-[11px] mt-1">{errors.value.message}</p>}
            </div>
          </div>

          {selectedType === "PERCENT" && (
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Mức giảm tối đa (VNĐ, để trống = không giới hạn)</label>
              <input
                type="number"
                {...register("maxDiscount")}
                placeholder="VD: 100000"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 font-mono"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Đơn hàng tối thiểu (VNĐ)</label>
              <input
                type="number"
                {...register("minOrderAmount")}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 font-mono"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Giới hạn mỗi khách (lần)</label>
              <input
                type="number"
                min="1"
                {...register("perCustomerLimit")}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Tổng lượt sử dụng toàn hệ thống (để trống = vô hạn)</label>
            <input
              type="number"
              min="1"
              {...register("usageLimit")}
              placeholder="VD: 50"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 font-mono"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1.5">
              Chi nhánh áp dụng (để trống = Toàn chuỗi)
            </label>
            <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100 max-h-32 overflow-y-auto">
              {branches.map((b) => {
                const checked = selectedBranchIds.includes(b.id);
                return (
                  <label key={b.id} className="flex items-center gap-2 cursor-pointer text-[11px] select-none">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => handleBranchToggle(b.id)}
                      className="rounded border-slate-300 text-pink-600 focus:ring-pink-500"
                    />
                    <span className="truncate">{b.name}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-pink-600 hover:bg-pink-700 disabled:opacity-50 text-white font-semibold flex items-center gap-1.5 cursor-pointer shadow-md shadow-pink-600/20"
            >
              {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{isEditing ? "Lưu thay đổi" : "Tạo voucher"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
