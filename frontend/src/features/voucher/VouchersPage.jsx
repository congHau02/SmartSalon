import React, { useState, useMemo } from "react";
import { Plus, Search, Tag, AlertCircle } from "lucide-react";
import { useAuth } from "../auth/useAuth";
import { useBranch } from "../branch/useBranch";
import {
  useVouchers,
  useCreateVoucher,
  useUpdateVoucher,
  useToggleVoucherActive,
} from "./useVouchers";
import { VoucherTable } from "./components/VoucherTable";
import { VoucherFormModal } from "./components/VoucherFormModal";
import { resolveVoucherErrorMessage } from "./voucher.constants";

export function VouchersPage() {
  const { hasAnyRole } = useAuth();
  const isAdmin = hasAnyRole(["ADMIN"]);
  const { branches } = useBranch();

  const [search, setSearch] = useState("");
  const [filterActive, setFilterActive] = useState("ALL");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedVoucher, setSelectedVoucher] = useState(null);
  const [notice, setNotice] = useState(null);

  const { data: vouchers = [], isLoading, isError, error } = useVouchers();

  const showNotice = (msg, type = "success") => {
    setNotice({ message: msg, type });
    setTimeout(() => setNotice(null), 4000);
  };

  const createMutation = useCreateVoucher({
    onSuccess: () => {
      setIsModalOpen(false);
      showNotice("Tạo mã voucher thành công!");
    },
    onError: (err) => showNotice(resolveVoucherErrorMessage(err), "error"),
  });

  const updateMutation = useUpdateVoucher({
    onSuccess: () => {
      setIsModalOpen(false);
      setSelectedVoucher(null);
      showNotice("Cập nhật mã voucher thành công!");
    },
    onError: (err) => showNotice(resolveVoucherErrorMessage(err), "error"),
  });

  const toggleMutation = useToggleVoucherActive({
    onSuccess: () => showNotice("Đã cập nhật trạng thái voucher!"),
    onError: (err) => showNotice(resolveVoucherErrorMessage(err), "error"),
  });

  const filteredVouchers = useMemo(() => {
    return vouchers.filter((v) => {
      const matchSearch =
        !search ||
        v.code?.toLowerCase().includes(search.toLowerCase()) ||
        v.name?.toLowerCase().includes(search.toLowerCase());
      const matchStatus =
        filterActive === "ALL" ||
        (filterActive === "ACTIVE" && v.active) ||
        (filterActive === "INACTIVE" && !v.active);
      return matchSearch && matchStatus;
    });
  }, [vouchers, search, filterActive]);

  const handleOpenCreate = () => {
    setSelectedVoucher(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (voucher) => {
    setSelectedVoucher(voucher);
    setIsModalOpen(true);
  };

  const handleSubmitForm = (formData) => {
    if (selectedVoucher) {
      updateMutation.mutate({ id: selectedVoucher.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-pink-100 text-pink-700 flex items-center justify-center">
              <Tag className="w-4 h-4" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Mã giảm giá & Khuyến mãi
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {isAdmin
              ? "Tạo và điều phối các mã giảm giá, voucher áp dụng toàn chuỗi hoặc theo chi nhánh"
              : "Danh sách các mã voucher đang có hiệu lực áp dụng tại chi nhánh của bạn"}
          </p>
        </div>

        {isAdmin && (
          <button
            type="button"
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-pink-600 hover:bg-pink-700 text-white font-semibold text-xs transition-colors shadow-md shadow-pink-600/20 cursor-pointer w-fit"
          >
            <Plus className="w-4 h-4" />
            <span>Tạo voucher mới</span>
          </button>
        )}
      </div>

      {notice && (
        <div
          className={`p-3 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
            notice.type === "error"
              ? "bg-rose-50 border-rose-200 text-rose-700"
              : "bg-emerald-50 border-emerald-200 text-emerald-700"
          }`}
        >
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{notice.message}</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo mã hoặc tên voucher..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500"
          />
        </div>
        <div className="flex gap-2">
          {["ALL", "ACTIVE", "INACTIVE"].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setFilterActive(st)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
                filterActive === st
                  ? "bg-slate-900 border-slate-900 text-white"
                  : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              {st === "ALL" ? "Tất cả" : st === "ACTIVE" ? "Đang chạy" : "Tạm dừng"}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="py-12 text-center text-xs text-slate-400">Đang tải danh sách voucher...</div>
      ) : isError ? (
        <div className="py-8 text-center text-xs text-rose-600">
          Không thể tải dữ liệu voucher: {error?.message}
        </div>
      ) : (
        <VoucherTable
          vouchers={filteredVouchers}
          isAdmin={isAdmin}
          onEdit={handleOpenEdit}
          onToggleActive={(id, active) => toggleMutation.mutate({ id, active })}
          isToggling={toggleMutation.isPending}
        />
      )}

      <VoucherFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmitForm}
        initialData={selectedVoucher}
        branches={branches || []}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
      />
    </div>
  );
}
