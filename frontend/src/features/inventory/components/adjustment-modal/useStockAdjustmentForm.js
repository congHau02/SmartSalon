import { useEffect, useMemo } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { stockAdjustmentSchema } from "./stockAdjustmentSchema";
import { ADJUSTMENT_REASONS } from "../../constants";

export function useStockAdjustmentForm({
  allCatalogProducts,
  inventoryItems,
  preselectedProductId,
  onSubmit,
}) {
  const availableOptions = useMemo(() => {
    if (!allCatalogProducts.length && inventoryItems.length) {
      return inventoryItems.map((item) => ({
        productId: item.productId,
        productName: item.productName,
        productSku: item.productSku,
        packagingUnit: item.packagingUnit,
        volumeOrWeightPerUnit: item.volumeOrWeightPerUnit,
        volumeUnit: item.volumeUnit,
        stockUnits: item.stockUnits ?? 0,
        currentVolume: item.currentVolume ?? 0,
        totalAvailableVolume: item.totalAvailableVolume ?? 0,
        isExistingInBranch: true,
      }));
    }

    return allCatalogProducts.map((p) => {
      const existing = inventoryItems.find((inv) => String(inv.productId) === String(p.id));
      return {
        productId: p.id,
        productName: p.name,
        productSku: p.sku,
        packagingUnit: p.unit,
        volumeOrWeightPerUnit: p.volumeOrWeightPerUnit,
        volumeUnit: p.volumeUnit,
        stockUnits: existing ? existing.stockUnits ?? 0 : 0,
        currentVolume: existing ? existing.currentVolume ?? 0 : 0,
        totalAvailableVolume: existing ? existing.totalAvailableVolume ?? 0 : 0,
        isExistingInBranch: Boolean(existing),
      };
    });
  }, [allCatalogProducts, inventoryItems]);

  const initialProductId = preselectedProductId
    ? String(preselectedProductId)
    : inventoryItems[0]?.productId
    ? String(inventoryItems[0].productId)
    : allCatalogProducts[0]?.id
    ? String(allCatalogProducts[0].id)
    : "";

  const initialItem = availableOptions.find((item) => String(item.productId) === String(initialProductId));

  const {
    register,
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(stockAdjustmentSchema),
    defaultValues: {
      productId: initialProductId,
      actualStockUnits: initialItem ? initialItem.stockUnits ?? 0 : 0,
      actualVolume: initialItem ? initialItem.currentVolume ?? 0 : 0,
      reason: ADJUSTMENT_REASONS[0],
      isCustomReason: false,
      customReason: "",
      unitCapacity: initialItem?.volumeOrWeightPerUnit || 1,
      packagingUnit: initialItem?.packagingUnit || "chai",
      volumeUnit: initialItem?.volumeUnit || "ml",
    },
    mode: "onTouched",
  });

  const watchedProductId = useWatch({ control, name: "productId" });
  const watchedStockUnits = useWatch({ control, name: "actualStockUnits" });
  const watchedVolume = useWatch({ control, name: "actualVolume" });
  const watchedIsCustomReason = useWatch({ control, name: "isCustomReason" });

  useEffect(() => {
    if (preselectedProductId) {
      setValue("productId", String(preselectedProductId));
      const found = availableOptions.find((item) => String(item.productId) === String(preselectedProductId));
      if (found) {
        setValue("actualStockUnits", found.stockUnits ?? 0);
        setValue("actualVolume", found.currentVolume ?? 0);
        setValue("unitCapacity", found.volumeOrWeightPerUnit || 1);
        setValue("packagingUnit", found.packagingUnit || "chai");
        setValue("volumeUnit", found.volumeUnit || "ml");
      }
    } else if (!watchedProductId && availableOptions.length > 0) {
      const first = availableOptions[0];
      setValue("productId", String(first.productId));
      setValue("actualStockUnits", first.stockUnits ?? 0);
      setValue("actualVolume", first.currentVolume ?? 0);
      setValue("unitCapacity", first.volumeOrWeightPerUnit || 1);
      setValue("packagingUnit", first.packagingUnit || "chai");
      setValue("volumeUnit", first.volumeUnit || "ml");
    }
  }, [preselectedProductId, availableOptions, watchedProductId, setValue]);

  const selectedItem = availableOptions.find(
    (item) => String(item.productId) === String(watchedProductId)
  );

  const systemTotalVolume = Number(selectedItem?.totalAvailableVolume) || 0;
  const unitCapacity = Number(selectedItem?.volumeOrWeightPerUnit) || 1;
  const actualTotalVolume =
    (Number(watchedStockUnits) || 0) * unitCapacity + (Number(watchedVolume) || 0);
  const volumeDelta = actualTotalVolume - systemTotalVolume;

  const onProductChange = (newId) => {
    setValue("productId", newId);
    const found = availableOptions.find((item) => String(item.productId) === String(newId));
    if (found) {
      setValue("actualStockUnits", found.stockUnits ?? 0);
      setValue("actualVolume", found.currentVolume ?? 0);
      setValue("unitCapacity", found.volumeOrWeightPerUnit || 1);
      setValue("packagingUnit", found.packagingUnit || "chai");
      setValue("volumeUnit", found.volumeUnit || "ml");
    }
  };

  const onFormSubmit = handleSubmit((data) => {
    const resolvedReason = data.isCustomReason ? data.customReason.trim() : data.reason.trim();
    const payload = {
      productId: Number(data.productId),
      actualStockUnits: Number(data.actualStockUnits),
      actualVolume: Number(data.actualVolume),
      reason: resolvedReason,
    };
    onSubmit(payload);
  });

  return {
    register,
    control,
    setValue,
    errors,
    availableOptions,
    selectedItem,
    watchedProductId,
    watchedIsCustomReason,
    volumeDelta,
    onProductChange,
    onFormSubmit,
  };
}
