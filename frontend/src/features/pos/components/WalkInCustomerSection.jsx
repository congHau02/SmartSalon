import React from "react";
import { User, Phone, Scissors } from "lucide-react";

export function WalkInCustomerSection({
  customerForm,
  stylistSelection,
  tab = customerForm?.tab,
  customerName = customerForm?.name,
  setCustomerName = customerForm?.setName,
  customerPhone = customerForm?.phone,
  setCustomerPhone = customerForm?.setPhone,
  selectedStylistId = stylistSelection?.selectedId,
  setSelectedStylistId = stylistSelection?.onSelect,
  stylists = stylistSelection?.stylists || [],
}) {
  return (
    <div className="space-y-4">
      {/* Customer Details (when detail tab) */}
      {tab === "detail" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-800/40 border border-slate-700/50">
          <div>
            <label className="text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1">
              <User className="w-3.5 h-3.5 text-slate-400" />
              <span>Họ tên khách hàng</span>
            </label>
            <input
              type="text"
              placeholder="Ví dụ: Nguyễn Văn A"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-pink-500"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1">
              <Phone className="w-3.5 h-3.5 text-slate-400" />
              <span>Số điện thoại <span className="text-pink-400">*</span></span>
            </label>
            <input
              type="tel"
              placeholder="09xxxxxxxx"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-pink-500"
            />
            <span className="text-[10px] text-slate-500 mt-1 block">
              Tự động tra cứu hồ sơ cũ hoặc tạo tài khoản mới
            </span>
          </div>
        </div>
      )}

      {/* Stylist Selector */}
      <div>
        <label className="text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1">
          <Scissors className="w-3.5 h-3.5 text-slate-400" />
          <span>Chỉ định Stylist thực hiện</span>
        </label>
        <select
          value={selectedStylistId}
          onChange={(e) => setSelectedStylistId(e.target.value)}
          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-pink-500 cursor-pointer"
        >
          <option value="">Stylist bất kỳ / Tự động điều phối</option>
          {stylists.map((st) => (
            <option key={st.stylistId} value={st.stylistId}>
              {st.fullName} {st.isBusy ? "(Đang bận)" : "(Đang rảnh)"}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
