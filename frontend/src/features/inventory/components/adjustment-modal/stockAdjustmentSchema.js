import { z } from "zod";

export const stockAdjustmentSchema = z
  .object({
    productId: z
      .union([z.number(), z.string()])
      .refine((val) => Boolean(val && Number(val) > 0), {
        message: "Vui lòng chọn sản phẩm kiểm kê",
      }),
    actualStockUnits: z.coerce
      .number()
      .int("Số lượng phải là số nguyên")
      .min(0, "Số lượng nguyên seal thực tế không thể âm"),
    actualVolume: z.coerce
      .number()
      .min(0, "Dung tích dở dang thực tế không thể âm"),
    reason: z.string().default(""),
    isCustomReason: z.boolean().default(false),
    customReason: z.string().default(""),
    unitCapacity: z.coerce.number().default(1),
    packagingUnit: z.string().default("chai"),
    volumeUnit: z.string().default("ml"),
  })
  .superRefine((data, ctx) => {
    // 1. Validate custom reason
    const resolvedReason = data.isCustomReason ? data.customReason.trim() : data.reason.trim();
    if (!resolvedReason || resolvedReason === "__custom__") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: [data.isCustomReason ? "customReason" : "reason"],
        message: "Vui lòng chọn hoặc nhập lý do điều chỉnh kho",
      });
    }

    // 2. Validate actual volume <= unit capacity
    if (data.unitCapacity > 0 && data.actualVolume > data.unitCapacity) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["actualVolume"],
        message: `Dung tích mở nắp không thể vượt quá dung tích chuẩn 1 ${data.packagingUnit} (${data.unitCapacity} ${data.volumeUnit})`,
      });
    }
  });
