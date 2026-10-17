import React, { useState, useEffect, useId } from "react";
import {
  X,
  Plus,
  Trash2,
  AlertCircle,
  FlaskConical,
  Layers,
  Sparkles,
  Info,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { useMasterProducts } from "./useServices";
import { formatCurrency } from "../../lib/utils";
import { PRESET_CATEGORIES, STEP_TEMPLATES } from "./constants";

function ServiceFormInner({
  initialData,
  onClose,
  onSubmit,
  isSubmitting,
  titleId,
}) {
  const isEditMode = Boolean(initialData?.id);

  // Active modal tab: "basic" | "bom" | "steps"
  const [activeTab, setActiveTab] = useState("basic");

  // Fetch consumable master products for BOM selector
  const { data: masterProducts = [] } = useMasterProducts({
    activeOnly: true,
  });

  // Initial State derived cleanly from initialData
  const [name, setName] = useState(() => initialData?.name || "");

  const initialCat = initialData?.category || PRESET_CATEGORIES[0];
  const isInitialCatPreset = PRESET_CATEGORIES.includes(initialCat);

  const [category, setCategory] = useState(() =>
    isInitialCatPreset ? initialCat : "__custom__"
  );
  const [customCategory, setCustomCategory] = useState(() =>
    isInitialCatPreset ? "" : initialCat
  );
  const [isCustomCategory, setIsCustomCategory] = useState(() => !isInitialCatPreset);

  const [durationMinutes, setDurationMinutes] = useState(
    () => initialData?.durationMinutes ?? 30
  );
  const [basePrice, setBasePrice] = useState(
    () => initialData?.basePrice ?? 150000
  );
  const [description, setDescription] = useState(
    () => initialData?.description || ""
  );
  const [isActive, setIsActive] = useState(
    () => initialData?.isActive !== false
  );

  // Dynamic BOM formulations list
  const [bomList, setBomList] = useState(() => {
    if (Array.isArray(initialData?.bomList) && initialData.bomList.length > 0) {
      return initialData.bomList.map((bom) => ({
        id: bom.id,
        productId: bom.productId,
        productName: bom.productName,
        productSku: bom.productSku,
        standardAmount: bom.standardAmount,
        unit: bom.unit || "ml",
      }));
    }
    return [];
  });

  // Dynamic Technical Steps & Commission
  const [defaultSteps, setDefaultSteps] = useState(() => {
    if (
      Array.isArray(initialData?.defaultSteps) &&
      initialData.defaultSteps.length > 0
    ) {
      return initialData.defaultSteps.map((s, idx) => ({
        id: s.id,
        stepName: s.stepName,
        stepOrder: s.stepOrder ?? idx + 1,
        commissionRate: s.commissionRate ?? 0,
      }));
    }
    return [
      { stepName: "Thực hiện dịch vụ chính", stepOrder: 1, commissionRate: 20 },
    ];
  });

  // Form validation errors
  const [errors, setErrors] = useState({});

  // Calculate total commission percentage
  const totalCommission = defaultSteps.reduce((sum, s) => {
    const rate = parseFloat(s.commissionRate) || 0;
    return sum + rate;
  }, 0);

  const isCommissionExceeded = totalCommission > 100;

  // BOM Actions
  const handleAddBomItem = () => {
    const firstProduct = masterProducts[0];
    setBomList((prev) => [
      ...prev,
      {
        productId: firstProduct ? firstProduct.id : "",
        productName: firstProduct ? firstProduct.name : "",
        productSku: firstProduct ? firstProduct.sku : "",
        standardAmount: 30,
        unit: firstProduct?.volumeUnit || firstProduct?.unit || "ml",
      },
    ]);
  };

  const handleUpdateBomItem = (index, field, value) => {
    setBomList((prev) => {
      const updated = [...prev];
      if (field === "productId") {
        const selectedProd = masterProducts.find((p) => String(p.id) === String(value));
        updated[index] = {
          ...updated[index],
          productId: value ? Number(value) : "",
          productName: selectedProd?.name || "",
          productSku: selectedProd?.sku || "",
          unit: selectedProd?.volumeUnit || selectedProd?.unit || updated[index].unit || "ml",
        };
      } else {
        updated[index] = {
          ...updated[index],
          [field]: value,
        };
      }
      return updated;
    });
  };

  const handleRemoveBomItem = (index) => {
    setBomList((prev) => prev.filter((_, idx) => idx !== index));
  };

  // Step Actions
  const handleAddStep = () => {
    setDefaultSteps((prev) => [
      ...prev,
      {
        stepName: "",
        stepOrder: prev.length + 1,
        commissionRate: 10,
      },
    ]);
  };

  const handleUpdateStep = (index, field, value) => {
    setDefaultSteps((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        [field]: value,
      };
      return updated;
    });
  };

  const handleRemoveStep = (index) => {
    setDefaultSteps((prev) => {
      const remaining = prev.filter((_, idx) => idx !== index);
      return remaining.map((s, idx) => ({ ...s, stepOrder: idx + 1 }));
    });
  };

  const handleApplyTemplate = (template) => {
    setDefaultSteps(
      template.steps.map((s, idx) => ({
        stepName: s.stepName,
        stepOrder: idx + 1,
        commissionRate: s.commissionRate,
      }))
    );
  };

  // Validation & Submit
  const validateForm = () => {
    const errs = {};

    if (!name.trim()) {
      errs.name = "Vui lòng nhập tên dịch vụ";
    }

    const resolvedCategory = isCustomCategory ? customCategory.trim() : category.trim();
    if (!resolvedCategory) {
      errs.category = "Vui lòng chọn hoặc nhập nhóm dịch vụ";
    }

    if (durationMinutes === "" || Number(durationMinutes) <= 0) {
      errs.durationMinutes = "Thời lượng thực hiện phải tối thiểu 1 phút";
    }

    if (basePrice === "" || Number(basePrice) <= 0) {
      errs.basePrice = "Giá cơ bản phải lớn hơn 0 VNĐ";
    }

    // Validate BOM items
    for (let i = 0; i < bomList.length; i++) {
      const item = bomList[i];
      if (!item.productId) {
        errs[`bom_${i}_product`] = "Vui lòng chọn sản phẩm vật tư";
      }
      if (!item.standardAmount || Number(item.standardAmount) <= 0) {
        errs[`bom_${i}_amount`] = "Định mức tiêu hao phải lớn hơn 0";
      }
    }

    // Validate Steps
    if (isCommissionExceeded) {
      errs.commission = `Tổng tỷ lệ hoa hồng (${totalCommission}%) không được vượt quá 100%`;
    }

    for (let i = 0; i < defaultSteps.length; i++) {
      const step = defaultSteps[i];
      if (!step.stepName.trim()) {
        errs[`step_${i}_name`] = "Vui lòng nhập tên bước kỹ thuật";
      }
      if (step.commissionRate === "" || Number(step.commissionRate) < 0) {
        errs[`step_${i}_rate`] = "Hoa hồng không được âm";
      }
    }

    setErrors(errs);
    return { isValid: Object.keys(errs).length === 0, errs };
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const { isValid, errs } = validateForm();
    if (!isValid) {
      if (errs.name || errs.category || errs.durationMinutes || errs.basePrice) {
        setActiveTab("basic");
      } else if (Object.keys(errs).some((k) => k.startsWith("bom_"))) {
        setActiveTab("bom");
      } else if (isCommissionExceeded || Object.keys(errs).some((k) => k.startsWith("step_"))) {
        setActiveTab("steps");
      }
      return;
    }

    const resolvedCategory = isCustomCategory ? customCategory.trim() : category.trim();

    const payload = {
      name: name.trim(),
      category: resolvedCategory,
      basePrice: Number(basePrice),
      durationMinutes: Number(durationMinutes),
      description: description.trim() || null,
      isActive: Boolean(isActive),
      bomList: bomList.map((item) => ({
        id: item.id || undefined,
        productId: Number(item.productId),
        standardAmount: Number(item.standardAmount),
        unit: item.unit ? item.unit.trim() : "ml",
      })),
      defaultSteps: defaultSteps.map((step, idx) => ({
        id: step.id || undefined,
        stepName: step.stepName.trim(),
        stepOrder: idx + 1,
        commissionRate: Number(step.commissionRate) || 0,
      })),
    };

    onSubmit(payload);
  };

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4.5 border-b border-slate-100 bg-slate-50/60">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-pink-100 text-pink-700 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5" aria-hidden="true" />
          </div>
          <div>
            <h2 id={titleId} className="text-lg font-bold text-slate-900 leading-tight">
              {isEditMode ? "Chỉnh sửa Dịch vụ & Công thức BOM" : "Thêm Dịch vụ Mới vào Danh mục"}
            </h2>
            <p className="text-xs text-slate-500">
              Thiết lập định lượng hoá chất tiêu hao và tỷ lệ chia hoa hồng cho từng thợ
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          disabled={isSubmitting}
          aria-label="Đóng cửa sổ"
          className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500"
        >
          <X className="w-5 h-5" aria-hidden="true" />
        </button>
      </div>

      {/* Global Error Banner if any validation fails */}
      {Object.keys(errors).length > 0 && (
        <div
          role="alert"
          className="mx-6 mt-4 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2.5 animate-in fade-in"
        >
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" aria-hidden="true" />
          <div className="flex-1 font-medium">
            Có thông tin chưa hợp lệ. Vui lòng kiểm tra lại các mục được đánh dấu màu đỏ.
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex items-center px-6 pt-3 border-b border-slate-200/80 gap-2 bg-white">
        <button
          type="button"
          onClick={() => setActiveTab("basic")}
          className={`flex items-center gap-2 py-3 px-3.5 border-b-2 text-xs font-bold transition-all cursor-pointer ${
            activeTab === "basic"
              ? "border-pink-600 text-pink-700"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Info className="w-4 h-4" />
          <span>Thông tin cơ bản</span>
          {(errors.name || errors.category || errors.durationMinutes || errors.basePrice) && (
            <span className="w-2 h-2 rounded-full bg-rose-500" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("bom")}
          className={`flex items-center gap-2 py-3 px-3.5 border-b-2 text-xs font-bold transition-all cursor-pointer ${
            activeTab === "bom"
              ? "border-pink-600 text-pink-700"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <FlaskConical className="w-4 h-4" />
          <span>Định mức BOM ({bomList.length})</span>
          {Object.keys(errors).some((k) => k.startsWith("bom_")) && (
            <span className="w-2 h-2 rounded-full bg-rose-500" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("steps")}
          className={`flex items-center gap-2 py-3 px-3.5 border-b-2 text-xs font-bold transition-all cursor-pointer ${
            activeTab === "steps"
              ? "border-pink-600 text-pink-700"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>
            Quy trình & Hoa hồng ({defaultSteps.length} bước - {totalCommission}%)
          </span>
          {(isCommissionExceeded || Object.keys(errors).some((k) => k.startsWith("step_"))) && (
            <span className="w-2 h-2 rounded-full bg-rose-500" />
          )}
        </button>
      </div>

      {/* Tab Contents Form Body */}
      <form id="service-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* TAB 1: BASIC INFO */}
        {activeTab === "basic" && (
          <div className="space-y-4.5 animate-in fade-in duration-150">
            {/* Service Name */}
            <div>
              <label
                htmlFor="service-name"
                className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
              >
                Tên dịch vụ <span className="text-pink-600">*</span>
              </label>
              <input
                id="service-name"
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (errors.name) setErrors((prev) => ({ ...prev, name: null }));
                }}
                placeholder="Ví dụ: Cắt tạo kiểu Master Stylist, Uốn xoăn Hippie..."
                className={`w-full h-11 px-3.5 rounded-xl border text-sm text-slate-900 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 transition-all ${
                  errors.name
                    ? "border-rose-400 focus:ring-rose-400/30"
                    : "border-slate-200 focus:border-pink-500 focus:ring-pink-500/20"
                }`}
              />
              {errors.name && <p className="mt-1 text-xs text-rose-600 font-medium">{errors.name}</p>}
            </div>

            {/* Category Selection */}
            <div>
              <label
                htmlFor="service-category"
                className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
              >
                Nhóm dịch vụ <span className="text-pink-600">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <select
                  id="service-category"
                  value={isCustomCategory ? "__custom__" : category}
                  onChange={(e) => {
                    if (e.target.value === "__custom__") {
                      setIsCustomCategory(true);
                    } else {
                      setIsCustomCategory(false);
                      setCategory(e.target.value);
                    }
                    if (errors.category) setErrors((prev) => ({ ...prev, category: null }));
                  }}
                  className="h-11 px-3.5 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 text-sm focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 focus:bg-white focus:outline-none transition-all cursor-pointer"
                >
                  {PRESET_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                  <option value="__custom__">+ Nhập nhóm mới khác...</option>
                </select>

                {isCustomCategory && (
                  <input
                    type="text"
                    value={customCategory}
                    onChange={(e) => {
                      setCustomCategory(e.target.value);
                      if (errors.category) setErrors((prev) => ({ ...prev, category: null }));
                    }}
                    placeholder="Nhập tên nhóm danh mục mới..."
                    className="h-11 px-3.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 focus:outline-none transition-all"
                  />
                )}
              </div>
              {errors.category && (
                <p className="mt-1 text-xs text-rose-600 font-medium">{errors.category}</p>
              )}
            </div>

            {/* Price & Duration Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Base Price */}
              <div>
                <label
                  htmlFor="service-price"
                  className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
                >
                  Giá cơ bản (VND) <span className="text-pink-600">*</span>
                </label>
                <div className="relative">
                  <input
                    id="service-price"
                    type="number"
                    min="0"
                    step="5000"
                    value={basePrice}
                    onChange={(e) => {
                      setBasePrice(e.target.value);
                      if (errors.basePrice) setErrors((prev) => ({ ...prev, basePrice: null }));
                    }}
                    className={`w-full h-11 pl-3.5 pr-14 rounded-xl border text-sm text-slate-900 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 transition-all ${
                      errors.basePrice
                        ? "border-rose-400 focus:ring-rose-400/30"
                        : "border-slate-200 focus:border-pink-500 focus:ring-pink-500/20"
                    }`}
                  />
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 pointer-events-none">
                    VNĐ
                  </div>
                </div>
                <p className="mt-1 text-[11px] text-slate-500 font-medium">
                  Hiển thị: {formatCurrency(Number(basePrice) || 0)}
                </p>
                {errors.basePrice && (
                  <p className="mt-0.5 text-xs text-rose-600 font-medium">{errors.basePrice}</p>
                )}
              </div>

              {/* Duration in Minutes */}
              <div>
                <label
                  htmlFor="service-duration"
                  className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
                >
                  Thời lượng dự kiến <span className="text-pink-600">*</span>
                </label>
                <div className="relative">
                  <input
                    id="service-duration"
                    type="number"
                    min="5"
                    step="5"
                    value={durationMinutes}
                    onChange={(e) => {
                      setDurationMinutes(e.target.value);
                      if (errors.durationMinutes)
                        setErrors((prev) => ({ ...prev, durationMinutes: null }));
                    }}
                    className={`w-full h-11 pl-3.5 pr-14 rounded-xl border text-sm text-slate-900 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 transition-all ${
                      errors.durationMinutes
                        ? "border-rose-400 focus:ring-rose-400/30"
                        : "border-slate-200 focus:border-pink-500 focus:ring-pink-500/20"
                    }`}
                  />
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 pointer-events-none">
                    Phút
                  </div>
                </div>
                <p className="mt-1 text-[11px] text-slate-500 font-medium">
                  Khoảng: {Math.floor((Number(durationMinutes) || 0) / 60)}h{" "}
                  {(Number(durationMinutes) || 0) % 60}m
                </p>
                {errors.durationMinutes && (
                  <p className="mt-0.5 text-xs text-rose-600 font-medium">
                    {errors.durationMinutes}
                  </p>
                )}
              </div>
            </div>

            {/* Description */}
            <div>
              <label
                htmlFor="service-desc"
                className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
              >
                Mô tả & Quy trình tóm tắt
              </label>
              <textarea
                id="service-desc"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ghi chú về công dụng, đối tượng khách hàng hoặc yêu cầu kỹ thuật đặc biệt..."
                className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 text-sm focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 focus:bg-white focus:outline-none transition-all placeholder:text-slate-400"
              />
            </div>

            {/* Active Toggle Switch */}
            <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
              <div>
                <span className="text-sm font-bold text-slate-900">Trạng thái kinh doanh</span>
                <p className="text-xs text-slate-500">
                  {isActive
                    ? "Dịch vụ đang mở bán và hiển thị trên giao diện Đặt lịch & POS"
                    : "Tạm ngưng cung cấp dịch vụ này trên hệ thống"}
                </p>
              </div>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="sr-only peer"
                  aria-label="Kích hoạt dịch vụ"
                />
                <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pink-600" />
              </label>
            </div>
          </div>
        )}

        {/* TAB 2: BOM FORMULATION BUILDER */}
        {activeTab === "bom" && (
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
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-pink-600 hover:bg-pink-700 text-white font-semibold text-xs transition-colors shrink-0 cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Thêm vật tư</span>
              </button>
            </div>

            {bomList.length === 0 ? (
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
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-pink-600 hover:bg-pink-700 text-white font-semibold text-xs shadow-xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Thêm vật tư đầu tiên</span>
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {bomList.map((bom, index) => (
                  <div
                    key={index}
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
                        value={bom.productId}
                        onChange={(e) =>
                          handleUpdateBomItem(index, "productId", e.target.value)
                        }
                        className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 focus:border-pink-500 focus:ring-1 focus:ring-pink-500 cursor-pointer"
                      >
                        <option value="">-- Chọn sản phẩm trong kho master --</option>
                        {masterProducts.map((prod) => (
                          <option key={prod.id} value={prod.id}>
                            {prod.name} ({prod.sku || "Chưa có SKU"}) - {prod.volumeOrWeightPerUnit}{" "}
                            {prod.volumeUnit || prod.unit}
                          </option>
                        ))}
                      </select>
                      {errors[`bom_${index}_product`] && (
                        <p className="mt-1 text-[11px] text-rose-600 font-medium">
                          {errors[`bom_${index}_product`]}
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
                        value={bom.standardAmount}
                        onChange={(e) =>
                          handleUpdateBomItem(index, "standardAmount", e.target.value)
                        }
                        placeholder="30"
                        className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 focus:border-pink-500 focus:ring-1 focus:ring-pink-500"
                      />
                      {errors[`bom_${index}_amount`] && (
                        <p className="mt-1 text-[11px] text-rose-600 font-medium">
                          {errors[`bom_${index}_amount`]}
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
                        value={bom.unit}
                        onChange={(e) => handleUpdateBomItem(index, "unit", e.target.value)}
                        placeholder="ml hoặc g"
                        className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 focus:border-pink-500 focus:ring-1 focus:ring-pink-500"
                      />
                    </div>

                    {/* Remove Button */}
                    <div className="pt-2 md:pt-5 flex justify-end">
                      <button
                        type="button"
                        onClick={() => handleRemoveBomItem(index)}
                        aria-label={`Xóa vật tư dòng ${index + 1}`}
                        className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
                      >
                        <Trash2 className="w-4 h-4" aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                ))}

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
        )}

        {/* TAB 3: STEP EDITOR & COMMISSION SPLITS */}
        {activeTab === "steps" && (
          <div className="space-y-4 animate-in fade-in duration-150">
            {/* Commission Summary Bar */}
            <div
              className={`p-4 rounded-2xl border transition-all ${
                isCommissionExceeded
                  ? "bg-rose-50 border-rose-300 text-rose-900"
                  : "bg-slate-50 border-slate-200 text-slate-800"
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <Layers
                    className={`w-4 h-4 ${
                      isCommissionExceeded ? "text-rose-600" : "text-pink-600"
                    }`}
                  />
                  <span className="font-bold text-xs uppercase tracking-wider">
                    Tổng tỷ lệ hoa hồng kỹ thuật:
                  </span>
                  <span
                    className={`text-sm font-extrabold ${
                      isCommissionExceeded ? "text-rose-600" : "text-pink-700"
                    }`}
                  >
                    {totalCommission}% / 100%
                  </span>
                </div>

                <span className="text-[11px] font-medium text-slate-500">
                  {isCommissionExceeded ? (
                    <span className="text-rose-600 font-bold">Vượt quá mức trần tối đa!</span>
                  ) : (
                    `Salon giữ lại: ${Math.max(0, 100 - totalCommission)}% doanh thu`
                  )}
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full h-2.5 rounded-full bg-slate-200 overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 rounded-full ${
                    isCommissionExceeded ? "bg-rose-500" : "bg-gradient-to-r from-pink-500 to-rose-400"
                  }`}
                  style={{ width: `${Math.min(totalCommission, 100)}%` }}
                />
              </div>

              {errors.commission && (
                <p className="mt-2 text-xs text-rose-600 font-bold flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{errors.commission}</span>
                </p>
              )}
            </div>

            {/* Quick Preset Buttons */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Mẫu quy trình phân bổ nhanh:
              </span>
              <div className="flex flex-wrap gap-2">
                {STEP_TEMPLATES.map((tpl) => (
                  <button
                    key={tpl.name}
                    type="button"
                    onClick={() => handleApplyTemplate(tpl)}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-pink-50 hover:text-pink-700 hover:border-pink-200 border border-slate-200 text-xs font-semibold text-slate-700 transition-all cursor-pointer"
                  >
                    {tpl.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Steps List */}
            <div className="space-y-3 pt-2">
              {defaultSteps.map((step, index) => (
                <div
                  key={index}
                  className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center gap-3 transition-all hover:border-slate-300"
                >
                  <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs shrink-0">
                    #{index + 1}
                  </div>

                  {/* Step Name */}
                  <div className="flex-1 min-w-0">
                    <label
                      htmlFor={`step-name-${index}`}
                      className="sr-only"
                    >
                      Tên bước kỹ thuật #{index + 1}
                    </label>
                    <input
                      id={`step-name-${index}`}
                      type="text"
                      value={step.stepName}
                      onChange={(e) => handleUpdateStep(index, "stepName", e.target.value)}
                      placeholder="Tên bước (vd: Cắt tạo dáng, Lên trục, Gội massage...)"
                      className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs text-slate-900 focus:border-pink-500 focus:ring-1 focus:ring-pink-500"
                    />
                    {errors[`step_${index}_name`] && (
                      <p className="mt-1 text-[11px] text-rose-600 font-medium">
                        {errors[`step_${index}_name`]}
                      </p>
                    )}
                  </div>

                  {/* Commission Rate */}
                  <div className="w-32 shrink-0 relative">
                    <label
                      htmlFor={`step-rate-${index}`}
                      className="sr-only"
                    >
                      Tỷ lệ hoa hồng %
                    </label>
                    <input
                      id={`step-rate-${index}`}
                      type="number"
                      min="0"
                      max="100"
                      step="0.5"
                      value={step.commissionRate}
                      onChange={(e) =>
                        handleUpdateStep(index, "commissionRate", e.target.value)
                      }
                      placeholder="15"
                      className="w-full h-10 pl-3 pr-8 rounded-xl border border-slate-200 text-xs text-slate-900 focus:border-pink-500 focus:ring-1 focus:ring-pink-500"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 pointer-events-none">
                      %
                    </div>
                  </div>

                  {/* Remove Step */}
                  <button
                    type="button"
                    onClick={() => handleRemoveStep(index)}
                    aria-label={`Xóa bước kỹ thuật ${index + 1}`}
                    className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
                  >
                    <Trash2 className="w-4 h-4" aria-hidden="true" />
                  </button>
                </div>
              ))}

              <button
                type="button"
                onClick={handleAddStep}
                className="w-full min-h-[44px] py-2.5 rounded-xl border-2 border-dashed border-slate-200 hover:border-pink-300 hover:bg-pink-50/40 text-xs font-bold text-slate-600 hover:text-pink-700 transition-all flex items-center justify-center gap-2 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500"
              >
                <Plus className="w-4 h-4" aria-hidden="true" />
                <span>Thêm bước kỹ thuật</span>
              </button>
            </div>
          </div>
        )}
      </form>

      {/* Modal Footer Controls */}
      <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/80">
        <div className="text-xs text-slate-500">
          {activeTab === "basic" && "Bước 1/3: Thông tin cơ bản"}
          {activeTab === "bom" && `Bước 2/3: ${bomList.length} vật tư định mức`}
          {activeTab === "steps" &&
            `Bước 3/3: ${defaultSteps.length} bước kỹ thuật (${totalCommission}% hoa hồng)`}
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold text-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            Hủy bỏ
          </button>

          <button
            type="submit"
            form="service-form"
            disabled={isSubmitting || isCommissionExceeded}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-pink-600 to-rose-500 hover:from-pink-700 hover:to-rose-600 text-white font-semibold text-xs shadow-md shadow-pink-500/20 active:scale-[0.99] transition-all flex items-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Đang lưu...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>{isEditMode ? "Lưu thay đổi" : "Tạo dịch vụ mới"}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </>
  );
}

export function ServiceFormModal({
  isOpen,
  onClose,
  initialData = null,
  onSubmit,
  isSubmitting = false,
}) {
  const titleId = useId();

  // Handle ESC key to dismiss
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen && !isSubmitting) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="presentation"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative w-full max-w-3xl my-6 bg-white rounded-3xl shadow-2xl border border-slate-200/90 flex flex-col max-h-[92vh] overflow-hidden animate-in zoom-in-95 duration-200"
      >
        <ServiceFormInner
          key={initialData?.id ? `edit-${initialData.id}` : "create"}
          initialData={initialData}
          onClose={onClose}
          onSubmit={onSubmit}
          isSubmitting={isSubmitting}
          titleId={titleId}
        />
      </div>
    </div>
  );
}
