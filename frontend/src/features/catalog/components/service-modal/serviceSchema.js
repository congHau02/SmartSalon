import { z } from "zod";

export const bomItemSchema = z.object({
  id: z.number().optional(),
  productId: z.union([z.number(), z.string()]).refine((val) => Boolean(val && Number(val) > 0), {
    message: "Vui lòng chọn sản phẩm vật tư",
  }),
  productName: z.string().optional(),
  productSku: z.string().optional(),
  standardAmount: z.coerce.number().positive("Định mức tiêu hao phải lớn hơn 0"),
  unit: z.string().default("ml"),
});

export const serviceStepSchema = z.object({
  id: z.number().optional(),
  stepName: z.string().trim().min(1, "Vui lòng nhập tên bước kỹ thuật"),
  stepOrder: z.number().default(1),
  commissionRate: z.coerce.number().min(0, "Hoa hồng không được âm"),
});

export const serviceFormSchema = z
  .object({
    name: z.string().trim().min(1, "Vui lòng nhập tên dịch vụ"),
    category: z.string().default(""),
    isCustomCategory: z.boolean().default(false),
    customCategory: z.string().default(""),
    durationMinutes: z.coerce.number().min(1, "Thời lượng thực hiện phải tối thiểu 1 phút"),
    basePrice: z.coerce.number().positive("Giá cơ bản phải lớn hơn 0 VNĐ"),
    description: z.string().default(""),
    isActive: z.boolean().default(true),
    bomList: z.array(bomItemSchema).default([]),
    defaultSteps: z.array(serviceStepSchema).min(1, "Dịch vụ phải có ít nhất 1 bước kỹ thuật"),
  })
  .superRefine((data, ctx) => {
    // 1. Resolve category
    const resolvedCat = data.isCustomCategory ? data.customCategory.trim() : data.category.trim();
    if (!resolvedCat || resolvedCat === "__custom__") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: [data.isCustomCategory ? "customCategory" : "category"],
        message: "Vui lòng chọn hoặc nhập nhóm dịch vụ",
      });
    }

    // 2. Validate total commission rate <= 100%
    const totalCommission = data.defaultSteps.reduce(
      (sum, s) => sum + (Number(s.commissionRate) || 0),
      0
    );
    if (totalCommission > 100) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["commission"],
        message: `Tổng tỷ lệ hoa hồng (${totalCommission}%) không được vượt quá 100%`,
      });
    }
  });
