import { describe, it, expect } from "vitest";
import { guestBookingSchema } from "../features/booking/booking.schema";

describe("guestBookingSchema with customerEmail", () => {
  const baseBooking = {
    customerName: "Nguyễn Văn A",
    customerPhone: "0912345678",
    notes: "Cắt tóc ngắn",
  };

  it("passes when customerEmail is omitted", () => {
    const result = guestBookingSchema.safeParse(baseBooking);
    expect(result.success).toBe(true);
  });

  it("passes when customerEmail is empty string", () => {
    const result = guestBookingSchema.safeParse({
      ...baseBooking,
      customerEmail: "",
    });
    expect(result.success).toBe(true);
  });

  it("passes when customerEmail is a valid email", () => {
    const result = guestBookingSchema.safeParse({
      ...baseBooking,
      customerEmail: "khachhang@example.com",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.customerEmail).toBe("khachhang@example.com");
    }
  });

  it("fails when customerEmail is invalid format", () => {
    const result = guestBookingSchema.safeParse({
      ...baseBooking,
      customerEmail: "not-an-email",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Email không đúng định dạng");
    }
  });
});
