import { useState } from "react";
import { useForm, useFieldArray, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { serviceFormSchema } from "./serviceSchema";
import { PRESET_CATEGORIES } from "../../constants";

export function useServiceForm({ initialData, onSubmit, masterProducts }) {
  const isEditMode = Boolean(initialData?.id);
  const [activeTab, setActiveTab] = useState("basic");

  const initialCat = initialData?.category || PRESET_CATEGORIES[0];
  const isInitialCatPreset = PRESET_CATEGORIES.includes(initialCat);

  const defaultValues = {
    name: initialData?.name || "",
    category: isInitialCatPreset ? initialCat : "__custom__",
    isCustomCategory: !isInitialCatPreset,
    customCategory: isInitialCatPreset ? "" : initialCat,
    durationMinutes: initialData?.durationMinutes ?? 30,
    basePrice: initialData?.basePrice ?? 150000,
    description: initialData?.description || "",
    isActive: initialData?.isActive !== false,
    bomList:
      Array.isArray(initialData?.bomList) && initialData.bomList.length > 0
        ? initialData.bomList.map((bom) => ({
            id: bom.id,
            productId: bom.productId,
            productName: bom.productName,
            productSku: bom.productSku,
            standardAmount: bom.standardAmount,
            unit: bom.unit || "ml",
          }))
        : [],
    defaultSteps:
      Array.isArray(initialData?.defaultSteps) && initialData.defaultSteps.length > 0
        ? initialData.defaultSteps.map((s, idx) => ({
            id: s.id,
            stepName: s.stepName,
            stepOrder: s.stepOrder ?? idx + 1,
            commissionRate: s.commissionRate ?? 0,
          }))
        : [{ stepName: "Thực hiện dịch vụ chính", stepOrder: 1, commissionRate: 20 }],
  };

  const {
    register,
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(serviceFormSchema),
    defaultValues,
    mode: "onTouched",
  });

  const {
    fields: bomFields,
    append: appendBom,
    remove: removeBom,
    update: updateBom,
  } = useFieldArray({
    control,
    name: "bomList",
  });

  const {
    fields: stepFields,
    append: appendStep,
    remove: removeStep,
    replace: replaceSteps,
  } = useFieldArray({
    control,
    name: "defaultSteps",
  });

  // Watched state for calculations using isolated useWatch
  const watchedSteps = useWatch({ control, name: "defaultSteps" }) || [];
  const watchedBasePrice = useWatch({ control, name: "basePrice" });
  const watchedDuration = useWatch({ control, name: "durationMinutes" });
  const watchedIsCustom = useWatch({ control, name: "isCustomCategory" });
  const watchedBomList = useWatch({ control, name: "bomList" }) || [];

  const totalCommission = watchedSteps.reduce((sum, s) => {
    return sum + (parseFloat(s?.commissionRate) || 0);
  }, 0);

  const isCommissionExceeded = totalCommission > 100;

  // BOM Actions
  const handleAddBomItem = () => {
    const firstProduct = masterProducts?.[0];
    appendBom({
      productId: firstProduct ? firstProduct.id : "",
      productName: firstProduct ? firstProduct.name : "",
      productSku: firstProduct ? firstProduct.sku : "",
      standardAmount: 30,
      unit: firstProduct?.volumeUnit || firstProduct?.unit || "ml",
    });
  };

  const handleProductSelect = (index, productId) => {
    const selectedProd = masterProducts?.find((p) => String(p.id) === String(productId));
    const current = bomFields[index];
    updateBom(index, {
      ...current,
      productId: productId ? Number(productId) : "",
      productName: selectedProd?.name || "",
      productSku: selectedProd?.sku || "",
      unit: selectedProd?.volumeUnit || selectedProd?.unit || current?.unit || "ml",
    });
  };

  // Step Actions
  const handleAddStep = () => {
    appendStep({
      stepName: "",
      stepOrder: stepFields.length + 1,
      commissionRate: 10,
    });
  };

  const handleApplyTemplate = (template) => {
    replaceSteps(
      template.steps.map((s, idx) => ({
        stepName: s.stepName,
        stepOrder: idx + 1,
        commissionRate: s.commissionRate,
      }))
    );
  };

  // Submission handler mapping to API format
  const onFormSubmit = handleSubmit(
    (data) => {
      const resolvedCategory = data.isCustomCategory
        ? data.customCategory.trim()
        : data.category.trim();

      const payload = {
        name: data.name.trim(),
        category: resolvedCategory,
        basePrice: Number(data.basePrice),
        durationMinutes: Number(data.durationMinutes),
        description: data.description?.trim() || null,
        isActive: Boolean(data.isActive),
        bomList: (data.bomList || []).map((item) => ({
          id: item.id || undefined,
          productId: Number(item.productId),
          standardAmount: Number(item.standardAmount),
          unit: item.unit ? item.unit.trim() : "ml",
        })),
        defaultSteps: (data.defaultSteps || []).map((step, idx) => ({
          id: step.id || undefined,
          stepName: step.stepName.trim(),
          stepOrder: idx + 1,
          commissionRate: Number(step.commissionRate) || 0,
        })),
      };

      onSubmit(payload);
    },
    (validationErrors) => {
      // Auto switch to active tab where the error is located
      if (
        validationErrors.name ||
        validationErrors.category ||
        validationErrors.customCategory ||
        validationErrors.durationMinutes ||
        validationErrors.basePrice
      ) {
        setActiveTab("basic");
      } else if (validationErrors.bomList) {
        setActiveTab("bom");
      } else if (validationErrors.commission || validationErrors.defaultSteps) {
        setActiveTab("steps");
      }
    }
  );

  return {
    isEditMode,
    activeTab,
    setActiveTab,
    register,
    control,
    setValue,
    errors,
    watchedBasePrice,
    watchedDuration,
    watchedIsCustom,
    bomFields,
    watchedBomList,
    handleAddBomItem,
    handleProductSelect,
    removeBom,
    stepFields,
    watchedSteps,
    totalCommission,
    isCommissionExceeded,
    handleAddStep,
    removeStep,
    handleApplyTemplate,
    onFormSubmit,
  };
}
