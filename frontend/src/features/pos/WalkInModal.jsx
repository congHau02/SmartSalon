import React, { useState } from "react";
import { AlertCircle } from "lucide-react";
import { WalkInCustomerSection } from "./components/WalkInCustomerSection";
import { WalkInItemSelection } from "./components/WalkInItemSelection";
import { WalkInHeader } from "./components/WalkInHeader";
import { WalkInFooter } from "./components/WalkInFooter";
import { useCreateWalkInOrder } from "./usePosQueries";

export function WalkInModal({
  isOpen,
  onClose,
  branchId,
  services = [],
  stylists = [],
  products = [],
  onSuccess,
}) {
  const [tab, setTab] = useState("anonymous"); // 'anonymous' | 'detail'
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [selectedStylistId, setSelectedStylistId] = useState("");
  const [selectedServiceIds, setSelectedServiceIds] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [notes, setNotes] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const handleClose = () => {
    setTab("anonymous");
    setCustomerName("");
    setCustomerPhone("");
    setSelectedStylistId("");
    setSelectedServiceIds([]);
    setSelectedProducts([]);
    setNotes("");
    setErrorMsg("");
    onClose();
  };

  const createOrderMutation = useCreateWalkInOrder({
    onSuccess: (data) => {
      if (onSuccess) onSuccess(data);
      handleClose();
    },
    onError: (err) => {
      setErrorMsg(
        err?.response?.data?.message || "Không thể tạo đơn hàng vãng lai. Vui lòng thử lại!"
      );
    },
  });

  if (!isOpen) return null;

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
    setSelectedProducts((prev) =>
      prev
        .map((p) => {
          if (p.productId === productId) {
            const newQty = p.quantity + delta;
            return newQty > 0 ? { ...p, quantity: newQty } : null;
          }
          return p;
        })
        .filter(Boolean)
    );
  };

  const totalServicesPrice = selectedServiceIds.reduce((sum, id) => {
    const s = services.find((srv) => srv.id === id);
    return sum + (s?.basePrice || 0);
  }, 0);

  const totalProductsPrice = selectedProducts.reduce((sum, item) => {
    const p = products.find((prod) => prod.id === item.productId);
    return sum + (p?.retailPrice || 0) * item.quantity;
  }, 0);

  const totalEstimated = totalServicesPrice + totalProductsPrice;

  const totalDuration = selectedServiceIds.reduce((sum, id) => {
    const s = services.find((srv) => srv.id === id);
    return sum + (s?.durationMinutes || 0);
  }, 0);

  const handleSubmit = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setErrorMsg("");

    if (selectedServiceIds.length === 0 && selectedProducts.length === 0) {
      setErrorMsg("Vui lòng chọn ít nhất 1 dịch vụ hoặc 1 sản phẩm!");
      return;
    }

    if (tab === "detail" && !customerPhone.trim()) {
      setErrorMsg("Vui lòng nhập số điện thoại khách hàng!");
      return;
    }

    const payload = {
      branchId: Number(branchId),
      isAnonymous: tab === "anonymous",
      customerName: tab === "anonymous" ? "Khách vãng lai" : customerName.trim() || "Khách lẻ",
      customerPhone: tab === "anonymous" ? "0000000000" : customerPhone.trim(),
      serviceIds: selectedServiceIds,
      assignedStaffId: selectedStylistId ? Number(selectedStylistId) : null,
      notes: notes.trim() || undefined,
      productItems: selectedProducts.map((p) => ({
        productId: p.productId,
        quantity: p.quantity,
      })),
    };

    createOrderMutation.mutate(payload);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl text-slate-100 shadow-2xl flex flex-col max-h-[90vh]">
        <WalkInHeader tab={tab} setTab={setTab} onClose={handleClose} />

        {errorMsg && (
          <div className="mx-4 mt-3 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-4">
          <WalkInCustomerSection
            customerForm={{
              tab,
              name: customerName,
              setName: setCustomerName,
              phone: customerPhone,
              setPhone: setCustomerPhone,
            }}
            stylistSelection={{
              selectedId: selectedStylistId,
              onSelect: setSelectedStylistId,
              stylists,
            }}
          />

          <WalkInItemSelection
            servicesState={{
              items: services,
              selectedIds: selectedServiceIds,
              onToggle: toggleService,
              totalDuration,
            }}
            productsState={{
              items: products,
              selectedItems: selectedProducts,
              onAdd: addProduct,
              onUpdateQuantity: updateProductQuantity,
            }}
          />

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

        <WalkInFooter
          totalEstimated={totalEstimated}
          onClose={handleClose}
          onSubmit={handleSubmit}
          isPending={createOrderMutation.isPending}
        />
      </div>
    </div>
  );
}
