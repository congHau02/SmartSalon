import { useState } from "react";
import { useCreateQuickServiceTicket } from "./useStylistWorklog";

const unitPrice = (item, key) => Number(item[key] ?? item.price) || 0;

export function useQuickTicketForm({ branchId, currentStylistId, stylists, services, products, onSuccess, onClose }) {
  const [selectedStylistId, setSelectedStylistId] = useState(() => currentStylistId || stylists[0]?.id || "");
  const [quickGuest, setQuickGuest] = useState(true);
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [selectedServiceIds, setSelectedServiceIds] = useState([]);
  const [productQty, setProductQty] = useState({}); // productId -> quantity
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [discountAmount, setDiscountAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const createMutation = useCreateQuickServiceTicket({
    onSuccess: (data) => {
      onSuccess?.(data);
      onClose();
    },
    onError: (err) => setErrorMsg(err?.response?.data?.message || "Không thể tạo phiếu cắt nhanh"),
  });

  const toggleService = (id) =>
    setSelectedServiceIds((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]));
  const setQty = (id, qty) => setProductQty((prev) => ({ ...prev, [id]: Math.max(0, qty) }));

  const servicesTotal = services
    .filter((s) => selectedServiceIds.includes(s.id))
    .reduce((sum, s) => sum + unitPrice(s, "basePrice"), 0);
  const productsTotal = products.reduce((sum, p) => sum + unitPrice(p, "retailPrice") * (productQty[p.id] || 0), 0);
  const discount = Math.max(0, Number(discountAmount) || 0);
  const finalAmount = Math.max(0, servicesTotal + productsTotal - discount);
  // Identified customers get tier discount / retained deposit applied server-side, so a client-side QR amount would be wrong.
  const canPreviewQr = quickGuest || !customerPhone.trim();

  const submit = (e) => {
    e.preventDefault();
    if (selectedServiceIds.length === 0) {
      setErrorMsg("Vui lòng chọn ít nhất một dịch vụ");
      return;
    }
    setErrorMsg("");
    createMutation.mutate({
      branchId,
      stylistId: selectedStylistId ? Number(selectedStylistId) : undefined,
      serviceIds: selectedServiceIds,
      productItems: Object.entries(productQty)
        .filter(([, q]) => q > 0)
        .map(([productId, quantity]) => ({ productId: Number(productId), quantity })),
      quickGuest,
      customerPhone: quickGuest ? undefined : customerPhone,
      customerName: quickGuest ? undefined : customerName,
      paymentMethod,
      discountAmount: discount > 0 ? discount : undefined,
      notes: notes || undefined,
    });
  };

  return {
    values: { selectedStylistId, quickGuest, customerPhone, customerName, selectedServiceIds, productQty, paymentMethod, discountAmount, notes },
    set: { setSelectedStylistId, setQuickGuest, setCustomerPhone, setCustomerName, setPaymentMethod, setDiscountAmount, setNotes },
    toggleService,
    setQty,
    finalAmount,
    canPreviewQr,
    errorMsg,
    isPending: createMutation.isPending,
    submit,
  };
}
