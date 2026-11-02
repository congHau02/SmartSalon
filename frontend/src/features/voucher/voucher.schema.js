import { z } from "zod";

export const voucherFormSchema = z
  .object({
    code: z
      .string()
      .min(2, "Mã giảm giá phải có ít nhất 2 ký tự")
      .max(50, "Mã giảm giá tối đa 50 ký tự")
      .regex(/^[A-Za-z0-9_-]+$/, "Mã chỉ chứa chữ cái, số, gạch nối hoặc gạch dưới"),
    name: z.string().max(255).optional().or(z.literal("")),
    description: z.string().max(500).optional().or(z.literal("")),
    type: z.enum(["PERCENT", "FIXED"]),
    value: z.coerce.number().positive("Giá trị giảm giá phải lớn hơn 0"),
    maxDiscount: z.coerce
      .number()
      .nonnegative("Mức giảm tối đa không được âm")
      .optional()
      .or(z.literal("")),
    minOrderAmount: z.coerce
      .number()
      .nonnegative("Đơn hàng tối thiểu không được âm")
      .default(0),
    startsAt: z.string().optional().or(z.literal("")),
    endsAt: z.string().optional().or(z.literal("")),
    usageLimit: z.coerce
      .number()
      .int()
      .positive("Giới hạn lượt dùng phải từ 1 trở lên")
      .optional()
      .or(z.literal("")),
    perCustomerLimit: z.coerce
      .number()
      .int()
      .positive("Giới hạn mỗi khách hàng phải từ 1 trở lên")
      .default(1),
    branchIds: z.array(z.number()).default([]),
  })
  .refine(
    (data) => {
      if (data.type === "PERCENT" && data.value > 100) {
        return false;
      }
      return true;
    },
    {
      message: "Tỷ lệ phần trăm giảm giá không được vượt quá 100%",
      path: ["value"],
    }
  );
