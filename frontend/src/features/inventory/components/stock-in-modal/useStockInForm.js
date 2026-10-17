import { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { stockInSchema } from "./stockInSchema";

export function useStockInForm({ preselectedProductId, products, onSubmit }) {
  const initialProductId = preselectedProductId
    ? String(preselectedProductId)
    : products?.[0]?.id
    ? String(products[0].id)
    : "";

  const initialProd = products?.find((p) => String(p.id) === String(initialProductId));

  const {
    register,
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(stockInSchema),
    defaultValues: {
      productId: initialProductId,
      quantityUnits: 5,
      unitCost: initialProd?.costPrice ?? "",
      notes: "",
    },
    mode: "onTouched",
  });

  const watchedProductId = useWatch({ control, name: "productId" });
  const watchedQuantity = useWatch({ control, name: "quantityUnits" });
  const watchedUnitCost = useWatch({ control, name: "unitCost" });

  useEffect(() => {
    if (preselectedProductId) {
      setValue("productId", String(preselectedProductId));
      const prod = products?.find((p) => String(p.id) === String(preselectedProductId));
      if (prod?.costPrice !== undefined) {
        setValue("unitCost", prod.costPrice);
      }
    } else if (!watchedProductId && products && products.length > 0) {
      const firstId = String(products[0].id);
      setValue("productId", firstId);
      if (products[0]?.costPrice !== undefined) {
        setValue("unitCost", products[0].costPrice);
      }
    }
  }, [preselectedProductId, products, watchedProductId, setValue]);

  const selectedProduct = products?.find((p) => String(p.id) === String(watchedProductId));

  const effectiveUnitCost =
    watchedUnitCost !== "" && watchedUnitCost !== undefined && watchedUnitCost !== null
      ? watchedUnitCost
      : (selectedProduct?.costPrice ?? "");

  const totalVolumeAdded = selectedProduct
    ? (Number(watchedQuantity) || 0) * (Number(selectedProduct.volumeOrWeightPerUnit) || 0)
    : 0;

  const totalCostEstimate =
    (Number(watchedQuantity) || 0) * (Number(effectiveUnitCost) || 0);

  const onProductChange = (newId) => {
    setValue("productId", newId);
    const prod = products?.find((p) => String(p.id) === String(newId));
    if (prod?.costPrice !== undefined) {
      setValue("unitCost", prod.costPrice);
    }
  };

  const onFormSubmit = handleSubmit((data) => {
    const payload = {
      productId: Number(data.productId),
      quantityUnits: Number(data.quantityUnits),
      unitCost:
        data.unitCost !== "" && data.unitCost !== null && data.unitCost !== undefined
          ? Number(data.unitCost)
          : null,
      notes: data.notes?.trim() || null,
    };
    onSubmit(payload);
  });

  return {
    register,
    errors,
    watchedProductId,
    selectedProduct,
    effectiveUnitCost,
    totalVolumeAdded,
    totalCostEstimate,
    onProductChange,
    onFormSubmit,
  };
}
