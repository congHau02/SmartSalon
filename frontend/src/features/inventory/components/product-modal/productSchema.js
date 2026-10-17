import { z } from "zod";
import { PACKAGING_UNITS, VOLUME_UNITS } from "../../constants";

export const productSchema = z.object({
  name: z.string().trim().min(1, "Vui lòng nhập tên sản phẩm / vật tư"),
  sku: z.string().trim().min(1, "Vui lòng nhập mã SKU định danh"),
  barcode: z.string().optional(),
  unit: z.string().default(PACKAGING_UNITS[0]),
  volumeOrWeightPerUnit: z.coerce.number().positive("Định lượng chuẩn phải lớn hơn 0"),
  volumeUnit: z.string().default(VOLUME_UNITS[0]),
  minStockAlertUnits: z.coerce.number().min(0, "Ngưỡng cảnh báo tồn kho tối thiểu không thể âm"),
  costPrice: z.coerce.number().min(0, "Giá vốn không thể âm"),
  retailPrice: z.coerce.number().min(0, "Giá bán lẻ không thể âm"),
  isActive: z.boolean().default(true),
});
