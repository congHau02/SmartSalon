import React, { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { analyticsApi } from "../../../api/analyticsApi";
import { formatCurrency } from "../../../lib/utils";
import { Button } from "../../../components/ui/Button";
import { 
  X, 
  DollarSign, 
  CheckCircle2, 
  AlertCircle, 
  Loader2,
  ShieldCheck,
  Building2
} from "lucide-react";

export function EditBaseSalaryModal({ staff, isOpen, onClose }) {
  const queryClient = useQueryClient();
  const [salaryInput, setSalaryInput] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (staff) {
      setSalaryInput(String(staff.baseSalary || 0));
      setErrorMessage("");
    }
  }, [staff]);

  const updateMutation = useMutation({
    mutationFn: (newSalary) => analyticsApi.updateStaffBaseSalary(staff.staffId, newSalary),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["analytics-staff-payroll"] });
      queryClient.invalidateQueries({ queryKey: ["analytics-pnl"] });
      onClose();
    },
    onError: (err) => {
      setErrorMessage(err?.response?.data?.message || "Không thể cập nhật lương cứng. Vui lòng thử lại.");
    },
  });

  if (!isOpen || !staff) return null;

  const handleSave = (e) => {
    e.preventDefault();
    const val = Number(salaryInput);
    if (isNaN(val) || val < 0) {
      setErrorMessage("Mức lương cứng phải là một số không âm.");
      return;
    }
    updateMutation.mutate(val);
  };

  const currentNumber = Number(salaryInput) || 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-base-salary-title"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-pink-50 text-pink-600 flex items-center justify-center font-bold">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h3 id="edit-base-salary-title" className="text-sm font-black text-slate-900">
                Điều chỉnh Lương cứng (Base Salary)
              </h3>
              <p className="text-xs text-slate-500">
                Thiết lập lương cố định tháng cho nhân viên
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-6 space-y-4">
          {/* Staff Info Card */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-pink-100 text-pink-700 font-black text-sm flex items-center justify-center">
              {staff.fullName ? staff.fullName.charAt(0).toUpperCase() : "NV"}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold text-slate-900 truncate">
                {staff.fullName}
              </div>
              <div className="text-xs text-slate-500 flex items-center gap-1.5 flex-wrap">
                <span>@{staff.username}</span>
                <span>•</span>
                <span className="font-medium text-pink-600">{staff.roles?.join(", ") || "STAFF"}</span>
                {staff.branchName && (
                  <>
                    <span>•</span>
                    <span className="truncate">{staff.branchName}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Salary Input */}
          <div className="space-y-1.5">
            <label htmlFor="baseSalaryInput" className="block text-xs font-bold uppercase tracking-wider text-slate-600">
              Mức lương cứng hàng tháng (VNĐ)
            </label>
            <div className="relative">
              <input
                id="baseSalaryInput"
                type="number"
                step="100000"
                min="0"
                value={salaryInput}
                onChange={(e) => {
                  setSalaryInput(e.target.value);
                  setErrorMessage("");
                }}
                className="w-full pl-3.5 pr-14 py-2.5 rounded-xl border border-slate-300 bg-white font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-pink-500/30 focus:border-pink-500 text-base"
                placeholder="Nhập mức lương (VD: 12000000)"
                required
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                VNĐ
              </span>
            </div>

            {/* Live Currency Preview */}
            <div className="flex items-center justify-between text-xs pt-1 px-1">
              <span className="text-slate-400">Quy đổi hiển thị:</span>
              <span className="font-black text-pink-600 text-sm">
                {formatCurrency(currentNumber)}
              </span>
            </div>
          </div>

          {/* Quick Increment Chips */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-[11px] font-medium text-slate-400 mr-1">Tăng nhanh:</span>
            {[500000, 1000000, 2000000].map((inc) => (
              <button
                key={inc}
                type="button"
                onClick={() => setSalaryInput(String((Number(salaryInput) || 0) + inc))}
                className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-pink-50 hover:text-pink-600 text-slate-600 border border-slate-200/80 transition-colors cursor-pointer"
              >
                +{formatCurrency(inc)}
              </button>
            ))}
          </div>

          {/* Impact Note */}
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200/70 text-amber-800 text-xs flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>
              Mức lương này được lưu cố định vào hồ sơ nhân viên và sẽ tự động cập nhật ngay lập tức chi phí lương cố định (Fixed Base Salary) trên báo cáo <strong>Tier 2 Realized P&L</strong>.
            </span>
          </div>

          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={updateMutation.isPending}
              className="text-xs font-bold"
            >
              Hủy bỏ
            </Button>
            <Button
              type="submit"
              disabled={updateMutation.isPending}
              className="text-xs font-bold gap-2 bg-pink-600 hover:bg-pink-700 text-white"
            >
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Đang lưu...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" /> Lưu mức lương
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
