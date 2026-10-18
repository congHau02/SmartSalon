import React, { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Camera,
  Upload,
  Trash2,
  Plus,
  CheckCircle2,
  Sparkles,
  Loader2,
  Save,
  X,
  Eye,
  FileText,
  User,
  FlaskConical,
  AlertCircle,
} from "lucide-react";
import { posApi } from "../../api/posApi";

export function VisualLogTab({
  orderId,
  order,
  stylists = [],
  products = [],
  onNotice,
}) {
  const queryClient = useQueryClient();
  const beforeFileInputRef = useRef(null);
  const afterFileInputRef = useRef(null);

  // 1. Fetch live Visual Log data
  const {
    data: visualLogData,
    isLoading,
    isRefetching,
    refetch,
    error,
  } = useQuery({
    queryKey: ["visual-log", orderId],
    queryFn: () => posApi.getVisualLog(orderId),
    enabled: !!orderId,
  });

  // Local editable draft state
  const [selectedStaffId, setSelectedStaffId] = useState("");
  const [formulaNotes, setFormulaNotes] = useState("");
  const [hairConditionNotes, setHairConditionNotes] = useState("");
  const [beforeImageUrl, setBeforeImageUrl] = useState("");
  const [afterImageUrl, setAfterImageUrl] = useState("");
  const [bomItems, setBomItems] = useState([]);

  // Extra chemical product picker modal state
  const [isAddChemicalOpen, setIsAddChemicalOpen] = useState(false);
  const [selectedAddProductId, setSelectedAddProductId] = useState("");
  const [addChemicalAmount, setAddChemicalAmount] = useState(30);

  // Full-image preview modal
  const [previewImage, setPreviewImage] = useState(null);

  // Uploading state indicators
  const [isUploadingBefore, setIsUploadingBefore] = useState(false);
  const [isUploadingAfter, setIsUploadingAfter] = useState(false);

  // Sync server data into local draft
  useEffect(() => {
    if (visualLogData) {
      setSelectedStaffId(visualLogData.staffId ? String(visualLogData.staffId) : "");
      setFormulaNotes(visualLogData.formulaNotes || "");
      setHairConditionNotes(visualLogData.hairConditionNotes || "");
      setBeforeImageUrl(visualLogData.beforeImageUrl || "");
      setAfterImageUrl(visualLogData.afterImageUrl || "");
      setBomItems(
        (visualLogData.bomItems || []).map((item) => ({
          productId: item.productId,
          productName: item.productName || "Hóa chất",
          productSku: item.productSku || "",
          standardAmount: item.standardAmount !== undefined && item.standardAmount !== null ? Number(item.standardAmount) : 0,
          actualAmount: item.actualAmount !== undefined && item.actualAmount !== null ? Number(item.actualAmount) : 0,
          unit: item.unit || "ml",
        }))
      );
    }
  }, [visualLogData]);

  // Mutations
  const saveMutation = useMutation({
    mutationFn: (payload) => posApi.saveVisualLog(orderId, payload),
    onSuccess: (savedData) => {
      queryClient.setQueryData(["visual-log", orderId], savedData);
      queryClient.invalidateQueries({ queryKey: ["order", orderId] });
      queryClient.invalidateQueries({ queryKey: ["dispatch"] });
      if (onNotice) {
        onNotice({
          type: "success",
          text: "Đã lưu công thức pha chế & ảnh kết quả Visual Log thành công!",
        });
      }
    },
    onError: (err) => {
      if (onNotice) {
        onNotice({
          type: "error",
          text: err?.response?.data?.message || err?.message || "Không thể lưu Visual Log.",
        });
      }
    },
  });

  const uploadMediaMutation = useMutation({
    mutationFn: (formData) => posApi.uploadMedia(formData),
  });

  // Handler for uploading image (Before / After)
  const handleFileUpload = async (e, target) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    if (target === "before") setIsUploadingBefore(true);
    if (target === "after") setIsUploadingAfter(true);

    try {
      const res = await uploadMediaMutation.mutateAsync(formData);
      const uploadedUrl = res?.url || res;
      if (target === "before") {
        setBeforeImageUrl(uploadedUrl);
      } else {
        setAfterImageUrl(uploadedUrl);
      }
      if (onNotice) {
        onNotice({
          type: "success",
          text: `Đã tải ảnh ${target === "before" ? "Trước" : "Sau"} lên thành công!`,
        });
      }
    } catch (err) {
      if (onNotice) {
        onNotice({
          type: "error",
          text: err?.response?.data?.message || "Tải ảnh thất bại. Chỉ chấp nhận JPG/PNG/WebP dưới 10MB.",
        });
      }
    } finally {
      if (target === "before") setIsUploadingBefore(false);
      if (target === "after") setIsUploadingAfter(false);
      // Reset input value so re-selecting same file triggers change
      e.target.value = "";
    }
  };

  // Handler for modifying BOM amount
  const handleAmountChange = (index, value) => {
    const parsed = parseFloat(value);
    const updated = [...bomItems];
    updated[index] = {
      ...updated[index],
      actualAmount: isNaN(parsed) ? 0 : parsed,
    };
    setBomItems(updated);
  };

  // Handler for removing a chemical row
  const handleRemoveItem = (index) => {
    const updated = bomItems.filter((_, i) => i !== index);
    setBomItems(updated);
  };

  // Handler for adding an extra chemical
  const handleAddChemical = () => {
    if (!selectedAddProductId) return;
    const selectedProd = products.find((p) => String(p.id) === String(selectedAddProductId));
    if (!selectedProd) return;

    // Check if already in table
    const existingIndex = bomItems.findIndex((b) => String(b.productId) === String(selectedProd.id));
    if (existingIndex >= 0) {
      const updated = [...bomItems];
      updated[existingIndex] = {
        ...updated[existingIndex],
        actualAmount: updated[existingIndex].actualAmount + (Number(addChemicalAmount) || 0),
      };
      setBomItems(updated);
    } else {
      setBomItems([
        ...bomItems,
        {
          productId: selectedProd.id,
          productName: selectedProd.name,
          productSku: selectedProd.sku || "",
          standardAmount: 0,
          actualAmount: Number(addChemicalAmount) || 0,
          unit: selectedProd.unit || "ml",
        },
      ]);
    }

    setIsAddChemicalOpen(false);
    setSelectedAddProductId("");
    setAddChemicalAmount(30);
  };

  // Handler for saving
  const handleSave = () => {
    const payload = {
      staffId: selectedStaffId ? Number(selectedStaffId) : null,
      formulaNotes,
      hairConditionNotes,
      beforeImageUrl,
      afterImageUrl,
      bomItems: bomItems.map((item) => ({
        productId: item.productId,
        productName: item.productName,
        productSku: item.productSku,
        standardAmount: item.standardAmount,
        actualAmount: item.actualAmount,
        unit: item.unit,
      })),
    };

    saveMutation.mutate(payload);
  };

  if (isLoading) {
    return (
      <div className="py-12 flex flex-col items-center justify-center text-slate-400 space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
        <p className="text-xs font-medium">Đang tổng hợp định mức tiêu chuẩn BOM và ảnh kỹ thuật...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-300 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>Lỗi khi tải thông tin Visual Log: {error?.message || "Đã xảy ra lỗi"}</span>
        </div>
        <button
          onClick={() => refetch()}
          className="px-2.5 py-1 bg-rose-500/20 hover:bg-rose-500/30 rounded text-rose-200 font-semibold"
        >
          Thử lại
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Visual Log Header Status & Staff Selector */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <FlaskConical className="w-5 h-5 text-pink-400" />
            <h3 className="text-sm font-bold text-white">
              Visual Log & Định mức hóa chất thực tế
            </h3>
            {visualLogData?.isSaved ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                <CheckCircle2 className="w-3 h-3" />
                Đã lưu hồ sơ
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                <Sparkles className="w-3 h-3" />
                Định mức tiêu chuẩn tự động (Chưa lưu)
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400">
            Hóa chất tiêu hao tại đây sẽ là căn cứ trừ trực tiếp thể tích đã mở nắp (ml/g) khi thanh toán POS.
          </p>
        </div>

        {/* Technician selector */}
        <div className="flex items-center gap-2 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700/80 text-xs">
          <User className="w-4 h-4 text-pink-400 shrink-0" />
          <span className="text-slate-300 font-medium">Kỹ thuật viên:</span>
          <select
            value={selectedStaffId}
            onChange={(e) => setSelectedStaffId(e.target.value)}
            className="bg-transparent text-white font-semibold focus:outline-none cursor-pointer"
          >
            <option value="" className="bg-slate-800 text-slate-400">
              -- Chọn kỹ thuật viên --
            </option>
            {stylists.map((st) => {
              const sId = st.stylistId || st.id;
              const sName = st.stylistName || st.fullName || st.username;
              return (
                <option key={sId} value={sId} className="bg-slate-800 text-white">
                  {sName}
                </option>
              );
            })}
          </select>
        </div>
      </div>

      {/* Chemical Consumption Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-pink-500" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Bảng tiêu hao hóa chất (ml / gram)
            </h4>
          </div>
          <button
            type="button"
            onClick={() => setIsAddChemicalOpen(true)}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-pink-500/10 text-pink-300 border border-pink-500/20 hover:bg-pink-500/20 transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Thêm hóa chất ngoài định mức</span>
          </button>
        </div>

        {bomItems.length === 0 ? (
          <div className="p-6 text-center border border-dashed border-slate-800 rounded-xl text-slate-400 text-xs">
            Chưa có hóa chất tiêu hao nào cho đơn này. Bấm &quot;Thêm hóa chất ngoài định mức&quot; để bổ sung.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/40">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-800/60 text-slate-400 font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Hóa chất / Vật tư</th>
                  <th className="py-2.5 px-3 text-right">Định mức chuẩn</th>
                  <th className="py-2.5 px-3 text-right w-36">Thực tế sử dụng</th>
                  <th className="py-2.5 px-3 text-center">ĐVT</th>
                  <th className="py-2.5 px-3 text-center w-14">Xóa</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {bomItems.map((item, idx) => {
                  const isOverridden =
                    item.standardAmount > 0 && item.actualAmount !== item.standardAmount;
                  return (
                    <tr key={`${item.productId}-${idx}`} className="hover:bg-slate-900/50 transition-colors">
                      <td className="py-2.5 px-3 font-medium text-white">
                        <div className="flex flex-col">
                          <span>{item.productName}</span>
                          {item.productSku && (
                            <span className="text-[10px] text-slate-400 font-mono">
                              {item.productSku}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-right text-slate-300 font-mono">
                        {item.standardAmount > 0 ? (
                          <span>
                            {item.standardAmount} {item.unit}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">Ngoài định mức</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <div className="inline-flex items-center justify-end gap-1.5">
                          <input
                            type="number"
                            min="0"
                            step="0.5"
                            value={item.actualAmount}
                            onChange={(e) => handleAmountChange(idx, e.target.value)}
                            className={`w-24 text-right px-2 py-1 rounded-lg text-xs font-mono font-bold focus:outline-none transition-colors ${
                              isOverridden
                                ? "bg-amber-500/10 border border-amber-500/50 text-amber-300 focus:border-amber-400"
                                : "bg-slate-800 border border-slate-700 text-white focus:border-pink-500"
                            }`}
                          />
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-center text-slate-400 font-medium font-mono">
                        {item.unit}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          title="Xóa hóa chất này"
                          className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Add Extra Consumable Chemical */}
      {isAddChemicalOpen && (
        <div className="p-4 bg-slate-800/95 border border-pink-500/30 rounded-2xl space-y-3 animate-in fade-in duration-150">
          <div className="flex items-center justify-between">
            <h5 className="text-xs font-bold text-pink-300 flex items-center gap-1.5">
              <Plus className="w-4 h-4" />
              Chọn sản phẩm hóa chất bổ sung
            </h5>
            <button
              type="button"
              onClick={() => setIsAddChemicalOpen(false)}
              className="text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2 space-y-1">
              <label className="text-[11px] text-slate-400">Sản phẩm vật tư</label>
              <select
                value={selectedAddProductId}
                onChange={(e) => setSelectedAddProductId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-pink-500"
              >
                <option value="">-- Chọn sản phẩm từ kho --</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.unit || "ml"} - SKU: {p.sku})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] text-slate-400">Số lượng (ml / gram)</label>
              <input
                type="number"
                min="1"
                step="1"
                value={addChemicalAmount}
                onChange={(e) => setAddChemicalAmount(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-bold text-white focus:outline-none focus:border-pink-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setIsAddChemicalOpen(false)}
              className="px-3 py-1.5 rounded-xl border border-slate-700 text-xs text-slate-300 hover:bg-slate-700 transition"
            >
              Hủy
            </button>
            <button
              type="button"
              disabled={!selectedAddProductId}
              onClick={handleAddChemical}
              className="px-4 py-1.5 rounded-xl bg-pink-600 hover:bg-pink-500 disabled:opacity-50 text-xs font-semibold text-white transition cursor-pointer"
            >
              Thêm vào bảng tiêu hao
            </button>
          </div>
        </div>
      )}

      {/* Formula & Hair Condition Notes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Formula Notes */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-sm space-y-2">
          <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-pink-400" />
            Công thức pha chế & Tỉ lệ thuốc
          </label>
          <textarea
            rows={3}
            value={formulaNotes}
            onChange={(e) => setFormulaNotes(e.target.value)}
            placeholder="Ví dụ: 1 phần Bột tẩy Blond Studio + 1.5 phần Oxy 9% (40 Vol), ủ nhiệt 35 phút..."
            className="w-full bg-slate-950/60 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 placeholder:text-slate-400 focus:outline-none focus:border-pink-500 transition-colors"
          />
        </div>

        {/* Hair Condition Notes */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-sm space-y-2">
          <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Tình trạng tóc & Lưu ý kỹ thuật
          </label>
          <textarea
            rows={3}
            value={hairConditionNotes}
            onChange={(e) => setHairConditionNotes(e.target.value)}
            placeholder="Ví dụ: Tóc mảnh đã qua tẩy 1 lần, ngọn yếu xơ, lưu ý không kéo thuốc sát chân tóc..."
            className="w-full bg-slate-950/60 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 placeholder:text-slate-400 focus:outline-none focus:border-pink-500 transition-colors"
          />
        </div>
      </div>

      {/* Before / After Photographs */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex items-center gap-2">
          <Camera className="w-4 h-4 text-pink-400" />
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
            Hình ảnh kết quả kỹ thuật (Trước & Sau khi làm)
          </h4>
        </div>

        {/* Hidden native file inputs */}
        <input
          ref={beforeFileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          className="hidden"
          onChange={(e) => handleFileUpload(e, "before")}
        />
        <input
          ref={afterFileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          className="hidden"
          onChange={(e) => handleFileUpload(e, "after")}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Card: Before Image */}
          <div className="border border-slate-800 rounded-xl p-3 bg-slate-950/40 space-y-2.5">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-slate-400" />
                Ảnh Trước khi làm (Before)
              </span>
              {beforeImageUrl && (
                <button
                  type="button"
                  onClick={() => setBeforeImageUrl("")}
                  className="text-slate-400 hover:text-rose-400 transition"
                  title="Xóa ảnh Trước"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {beforeImageUrl ? (
              <div className="relative group rounded-xl overflow-hidden aspect-video bg-slate-900 border border-slate-800">
                <img
                  src={beforeImageUrl}
                  alt="Ảnh trước khi làm"
                  className="w-full h-full object-cover transition duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPreviewImage(beforeImageUrl)}
                    className="p-2 rounded-lg bg-slate-800/90 text-white hover:bg-slate-700 transition"
                    title="Xem ảnh lớn"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => beforeFileInputRef.current?.click()}
                    className="p-2 rounded-lg bg-pink-600 text-white hover:bg-pink-500 transition"
                    title="Thay đổi ảnh"
                  >
                    <Upload className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div
                onClick={() => !isUploadingBefore && beforeFileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-800 hover:border-pink-500/50 rounded-xl aspect-video flex flex-col items-center justify-center p-4 text-center cursor-pointer transition-colors group"
              >
                {isUploadingBefore ? (
                  <div className="flex flex-col items-center gap-2 text-pink-400">
                    <Loader2 className="w-6 h-6 animate-spin" />
                    <span className="text-xs">Đang tải ảnh lên...</span>
                  </div>
                ) : (
                  <>
                    <Camera className="w-8 h-8 text-slate-400 group-hover:text-pink-400 transition-colors mb-2" />
                    <span className="text-xs font-semibold text-slate-300 group-hover:text-pink-300">
                      Tải ảnh Trước (Before)
                    </span>
                    <span className="text-[11px] text-slate-400 mt-1">
                      PNG, JPG, WebP tối đa 10MB
                    </span>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Card: After Image */}
          <div className="border border-slate-800 rounded-xl p-3 bg-slate-950/40 space-y-2.5">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                Ảnh Sau khi hoàn thành (After)
              </span>
              {afterImageUrl && (
                <button
                  type="button"
                  onClick={() => setAfterImageUrl("")}
                  className="text-slate-400 hover:text-rose-400 transition"
                  title="Xóa ảnh Sau"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {afterImageUrl ? (
              <div className="relative group rounded-xl overflow-hidden aspect-video bg-slate-900 border border-slate-800">
                <img
                  src={afterImageUrl}
                  alt="Ảnh sau khi hoàn thành"
                  className="w-full h-full object-cover transition duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPreviewImage(afterImageUrl)}
                    className="p-2 rounded-lg bg-slate-800/90 text-white hover:bg-slate-700 transition"
                    title="Xem ảnh lớn"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => afterFileInputRef.current?.click()}
                    className="p-2 rounded-lg bg-pink-600 text-white hover:bg-pink-500 transition"
                    title="Thay đổi ảnh"
                  >
                    <Upload className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div
                onClick={() => !isUploadingAfter && afterFileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-800 hover:border-pink-500/50 rounded-xl aspect-video flex flex-col items-center justify-center p-4 text-center cursor-pointer transition-colors group"
              >
                {isUploadingAfter ? (
                  <div className="flex flex-col items-center gap-2 text-pink-400">
                    <Loader2 className="w-6 h-6 animate-spin" />
                    <span className="text-xs">Đang tải ảnh lên...</span>
                  </div>
                ) : (
                  <>
                    <Camera className="w-8 h-8 text-slate-400 group-hover:text-emerald-400 transition-colors mb-2" />
                    <span className="text-xs font-semibold text-slate-300 group-hover:text-emerald-300">
                      Tải ảnh Sau (After)
                    </span>
                    <span className="text-[11px] text-slate-400 mt-1">
                      PNG, JPG, WebP tối đa 10MB
                    </span>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Save Button Action */}
      <div className="flex items-center justify-end pt-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={saveMutation.isPending || isUploadingBefore || isUploadingAfter}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-pink-600 hover:bg-pink-500 disabled:opacity-50 text-white font-semibold text-xs transition shadow-lg shadow-pink-600/20 cursor-pointer"
        >
          {saveMutation.isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Đang lưu Visual Log...</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>Lưu Visual Log & Định mức hóa chất</span>
            </>
          )}
        </button>
      </div>

      {/* Full-size Image Preview Modal */}
      {previewImage && (
        <div
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div className="relative max-w-4xl max-h-[90vh] rounded-2xl overflow-hidden border border-slate-700 bg-slate-900">
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute top-3 right-3 p-2 rounded-full bg-slate-800/80 text-white hover:bg-slate-700 transition"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={previewImage}
              alt="Ảnh phóng to"
              className="w-full h-auto max-h-[85vh] object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
}
