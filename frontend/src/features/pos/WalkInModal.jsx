import React, { useState, useMemo } from "react";
import {
  X,
  Zap,
  User,
  Phone,
  Scissors,
  ShoppingBag,
  Plus,
  Minus,
  Check,
  Loader2,
  Clock,
  Sparkles,
} from "lucide-react";
import { formatCurrency } from "../../lib/utils";

export function WalkInModal({
  isOpen,
  onClose,
  branchId,
  stylists = [],
  services = [],
  products = [],
  onSubmit,
  isSubmitting,
}) {
  const [tab, setTab] = useState("quick"); // 'quick' | 'detail'
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [selectedStylistId, setSelectedStylistId] = useState("");
  const [selectedServiceIds, setSelectedServiceIds] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]); // [{ productId, quantity }]
  const [notes, setNotes] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Auto-select first available stylist when opening modal if none chosen
  React.useEffect(() => {
    if (isOpen) {
      const freeStylist = stylists.find((s) => !s.isBusy) || stylists[0];
      if (freeStylist) {
        setSelectedStylistId(freeStylist.stylistId?.toString() || "");
      }
      setSelectedServiceIds([]);
      setSelectedProducts([]);
      setCustomerName("");
      setCustomerPhone("");
      setNotes("");
      setErrorMsg("");
      setTab("quick");
    }
  }, [isOpen, stylists]);

  const toggleService = (id) => {
    setSelectedServiceIds((prev) =>
      prev.includes(id) ? prev.filter((sId) => sId !== id) : [...prev, id]
    );
  };

  const addProduct = (productId) => {
    setSelectedProducts((prev) => {
      const existing = prev.find((p) => p.productId === productId);
      if (existing) {
        return prev.map((p) =>
          p.productId === productId ? { ...p, quantity: p.quantity + 1 } : p
        );
      }
      return [...prev, { productId, quantity: 1 }];
    });
  };

  const updateProductQuantity = (productId, delta) => {
    setSelectedProducts((prev) => {
      return prev
        .map((p) => {
          if (p.productId === productId) {
            const newQty = p.quantity + delta;
            return newQty > 0 ? { ...p, quantity: newQty } : null;
          }
          return p;
        })
        .filter(Boolean);
    });
  };

  // Calculations
  const servicesSubtotal = useMemo(() => {
    return selectedServiceIds.reduce((sum, id) => {
      const s = services.find((srv) => srv.id === id);
      return sum + (s?.basePrice ? Number(s.basePrice) : 0);
    }, 0);
  }, [selectedServiceIds, services]);

  const productsSubtotal = useMemo(() => {
    return selectedProducts.reduce((sum, item) => {
      const p = products.find((prod) => prod.id === item.productId);
      return sum + (p?.retailPrice ? Number(p.retailPrice) : 0) * item.quantity;
    }, 0);
  }, [selectedProducts, products]);

  const totalDuration = useMemo(() => {
    return selectedServiceIds.reduce((sum, id) => {
      const s = services.find((srv) => srv.id === id);
      return sum + (s?.durationMinutes ? Number(s.durationMinutes) : 30);
    }, 0);
  }, [selectedServiceIds, services]);

  const totalAmount = servicesSubtotal + productsSubtotal;

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg("");

    if (selectedServiceIds.length === 0 && selectedProducts.length === 0) {
      setErrorMsg("Vui lòng chọn ít nhất 1 dịch vụ hoặc sản phẩm bán lẻ.");
      return;
    }

    if (tab === "detail" && !customerPhone.trim()) {
      setErrorMsg("Vui lòng nhập số điện thoại khách hàng khi tạo đơn chi tiết.");
      return;
    }

    const payload = {
      branchId,
      isQuickGuest: tab === "quick",
      customerName: tab === "quick" ? "Khách lẻ nhanh" : customerName.trim(),
      customerPhone: tab === "quick" ? "0000000000" : customerPhone.trim(),
      stylistId: selectedStylistId ? Number(selectedStylistId) : null,
      serviceIds: selectedServiceIds,
      productItems: selectedProducts,
      notes: notes.trim(),
    };

    onSubmit(payload);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-850">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-pink-500/10 text-pink-400 border border-pink-500/20 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Mở Đơn Khách Vãng Lai (Walk-in)</h3>
              <p className="text-xs text-slate-400">Tạo đơn phục vụ tức thời cho khách không đặt hẹn trước</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="px-6 pt-4 pb-2 border-b border-slate-800 flex gap-2">
          <button
            type="button"
            onClick={() => setTab("quick")}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              tab === "quick"
                ? "bg-pink-600 text-white shadow-md shadow-pink-600/30"
                : "bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-750"
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Khách lẻ nhanh (walkin.guest)</span>
          </button>
          <button
            type="button"
            onClick={() => setTab("detail")}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              tab === "detail"
                ? "bg-pink-600 text-white shadow-md shadow-pink-600/30"
                : "bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-750"
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Thông tin khách hàng</span>
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {errorMsg && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs">
              {errorMsg}
            </div>
          )}

          {/* Customer Details (when detail tab) */}
          {tab === "detail" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-800/40 border border-slate-700/50">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  Họ tên khách hàng
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
                <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  Số điện thoại <span className="text-pink-400">*</span>
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
            <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1">
              <Scissors className="w-3.5 h-3.5 text-slate-400" />
              Chỉ định Stylist thực hiện
            </label>
            <select
              value={selectedStylistId}
              onChange={(e) => setSelectedStylistId(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
            >
              <option value="">Stylist bất kỳ / Tự động điều phối</option>
              {stylists.map((st) => (
                <option key={st.stylistId} value={st.stylistId}>
                  {st.fullName} {st.isBusy ? "(Đang bận)" : "(Đang rảnh)"}
                </option>
              ))}
            </select>
          </div>

          {/* Services Selection */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-slate-300 flex items-center gap-1">
                <Scissors className="w-3.5 h-3.5 text-pink-400" />
                Chọn dịch vụ ({selectedServiceIds.length})
              </label>
              {totalDuration > 0 && (
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> ~{totalDuration} phút
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-44 overflow-y-auto p-1 scrollbar-thin">
              {services.map((svc) => {
                const isSelected = selectedServiceIds.includes(svc.id);
                return (
                  <div
                    key={svc.id}
                    onClick={() => toggleService(svc.id)}
                    className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all flex items-center justify-between ${
                      isSelected
                        ? "bg-pink-500/10 border-pink-500/50 text-white"
                        : "bg-slate-800/60 border-slate-700/60 text-slate-300 hover:border-slate-600"
                    }`}
                  >
                    <div className="min-w-0 pr-2">
                      <p className="text-xs font-semibold truncate">{svc.name}</p>
                      <p className="text-[11px] text-pink-400 font-mono mt-0.5">
                        {formatCurrency(svc.basePrice)}
                      </p>
                    </div>
                    <div
                      className={`w-4 h-4 rounded flex items-center justify-center shrink-0 ${
                        isSelected ? "bg-pink-500 text-white" : "border border-slate-600"
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Retail Products Selection (Optional) */}
          {products.length > 0 && (
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-2 flex items-center gap-1">
                <ShoppingBag className="w-3.5 h-3.5 text-purple-400" />
                Sản phẩm bán lẻ mang về (Tùy chọn)
              </label>
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
                {products.map((prod) => {
                  const current = selectedProducts.find((p) => p.productId === prod.id);
                  const qty = current ? current.quantity : 0;
                  return (
                    <div
                      key={prod.id}
                      className={`flex-shrink-0 w-48 p-2.5 rounded-xl border ${
                        qty > 0
                          ? "bg-purple-500/10 border-purple-500/40"
                          : "bg-slate-800/60 border-slate-700/60"
                      }`}
                    >
                      <p className="text-xs font-medium text-slate-200 truncate">{prod.name}</p>
                      <p className="text-[11px] font-mono text-purple-400 mt-0.5">
                        {formatCurrency(prod.retailPrice)}
                      </p>
                      <div className="mt-2 flex items-center justify-between">
                        {qty === 0 ? (
                          <button
                            type="button"
                            onClick={() => addProduct(prod.id)}
                            className="w-full py-1 px-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-xs text-slate-200 flex items-center justify-center gap-1 transition-colors"
                          >
                            <Plus className="w-3 h-3" /> Thêm
                          </button>
                        ) : (
                          <div className="flex items-center gap-2 w-full justify-between bg-slate-800 px-2 py-0.5 rounded-lg border border-slate-700">
                            <button
                              type="button"
                              onClick={() => updateProductQuantity(prod.id, -1)}
                              className="text-slate-400 hover:text-white"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="text-xs font-bold text-white">{qty}</span>
                            <button
                              type="button"
                              onClick={() => updateProductQuantity(prod.id, 1)}
                              className="text-slate-400 hover:text-white"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Ghi chú yêu cầu của khách
            </label>
            <input
              type="text"
              placeholder="Yêu cầu riêng, thợ quen, tình trạng tóc..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-pink-500"
            />
          </div>
        </form>

        {/* Footer Summary & Action */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-850 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400">Tạm tính đơn hàng:</span>
            <div className="text-lg font-bold font-mono text-pink-400">
              {formatCurrency(totalAmount)}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-pink-600 to-pink-500 hover:from-pink-500 hover:to-pink-400 shadow-lg shadow-pink-600/30 flex items-center gap-2 disabled:opacity-50 transition-all cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Đang mở đơn...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Mở đơn & Đưa vào hàng chờ</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
