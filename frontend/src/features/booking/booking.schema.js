import * as z from "zod";

export const guestBookingSchema = z.object({
  customerName: z
    .string()
    .trim()
    .min(2, "Họ và tên phải có ít nhất 2 ký tự")
    .max(100, "Họ và tên không vượt quá 100 ký tự"),
  customerPhone: z
    .string()
    .trim()
    .regex(
      /^(0[35789])[0-9]{8}$/,
      "Số điện thoại không hợp lệ (10 chữ số, đầu 03, 05, 07, 08, 09)"
    ),
  notes: z.string().max(500, "Ghi chú không vượt quá 500 ký tự").optional(),
});
