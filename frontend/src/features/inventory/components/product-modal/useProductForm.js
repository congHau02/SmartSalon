import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { productSchema } from "./productSchema";
import { PACKAGING_UNITS, VOLUME_UNITS } from "../../constants";

export function useProductForm({ initialData, onSubmit }) {
  const isEditMode = Boolean(initialData?.id);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: initialData?.name || "",
      sku: initialData?.sku || "",
      barcode: initialData?.barcode || "",
      unit: initialData?.unit || PACKAGING_UNITS[0],
      volumeOrWeightPerUnit: initialData?.volumeOrWeightPerUnit ?? 500,
      volumeUnit: initialData?.volumeUnit || VOLUME_UNITS[0],
      minStockAlertUnits: initialData?.minStockAlertUnits ?? 5,
      costPrice: initialData?.costPrice ?? 100000,
      retailPrice: initialData?.retailPrice ?? 150000,
      isActive: initialData?.isActive !== false,
    },
    mode: "onTouched",
  });

  const watchedCostPrice = useWatch({ control, name: "costPrice" });
  const watchedRetailPrice = useWatch({ control, name: "retailPrice" });

  const onFormSubmit = handleSubmit((data) => {
    const payload = {
      name: data.name.trim(),
      sku: data.sku.trim().toUpperCase(),
      barcode: data.barcode?.trim() || null,
      unit: data.unit.trim(),
      volumeOrWeightPerUnit: Number(data.volumeOrWeightPerUnit),
      volumeUnit: data.volumeUnit.trim(),
      minStockAlertUnits: Number(data.minStockAlertUnits),
      costPrice: Number(data.costPrice),
      retailPrice: Number(data.retailPrice),
      isActive: Boolean(data.isActive),
    };
    onSubmit(payload);
  });

  return {
    isEditMode,
    register,
    errors,
    watchedCostPrice,
    watchedRetailPrice,
    onFormSubmit,
  };
}
