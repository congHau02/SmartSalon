import { z } from "zod";

export const stockInSchema = z.object({
  productId: z
    .union([z.number(), z.string()])
    .refine((val) => Boolean(val && Number(val) > 0), {
      message: "Vui lòng chọn sản phẩm nhập kho",
    }),
  quantityUnits: z.coerce
    .number()
    .int("Số lượng phải là số nguyên")
    .min(1, "Số lượng nhập kho phải tối thiểu 1 đơn vị"),
  unitCost: z
    .union([z.coerce.number().min(0, "Đơn giá nhập không thể âm"), z.literal(""), z.null()])
    .optional(),
  notes: z.string().optional(),
});
