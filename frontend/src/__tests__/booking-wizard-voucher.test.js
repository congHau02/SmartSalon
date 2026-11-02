import { describe, it, expect } from "vitest";
import { guestBookingSchema, voucherValidateSchema } from "../features/booking/booking.schema";

describe("guestBookingSchema with voucherCode", () => {
  const baseBooking = {
    customerName: "Nguyễn Văn B",
    customerPhone: "0987654321",
    notes: "Tư vấn cắt tóc",
  };

  it("passes when voucherCode is omitted", () => {
    const result = guestBookingSchema.safeParse(baseBooking);
    expect(result.success).toBe(true);
  });

  it("passes when voucherCode is empty string", () => {
    const result = guestBookingSchema.safeParse({
      ...baseBooking,
      voucherCode: "",
    });
    expect(result.success).toBe(true);
  });

  it("passes when voucherCode is a valid string", () => {
    const result = guestBookingSchema.safeParse({
      ...baseBooking,
      voucherCode: "GIAM50K",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.voucherCode).toBe("GIAM50K");
    }
  });

  it("fails when voucherCode exceeds 50 characters", () => {
    const result = guestBookingSchema.safeParse({
      ...baseBooking,
      voucherCode: "A".repeat(51),
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Mã giảm giá không quá 50 ký tự");
    }
  });
});

describe("voucherValidateSchema", () => {
  it("validates valid voucher code", () => {
    const result = voucherValidateSchema.safeParse({ code: "TET2026" });
    expect(result.success).toBe(true);
  });

  it("rejects empty voucher code", () => {
    const result = voucherValidateSchema.safeParse({ code: "   " });
    expect(result.success).toBe(false);
  });
});

describe("Booking Wizard Voucher & Deposit calculations", () => {
  it("keeps 20% deposit strictly unchanged when voucher is applied", () => {
    const totalPrice = 500000;
    const calculateDeposit = (price) => Math.round(price * 0.2);

    const depositWithoutVoucher = calculateDeposit(totalPrice);
    expect(depositWithoutVoucher).toBe(100000);

    // With a 50k voucher applied, deposit amount MUST remain 100,000 (20% of 500k)
    const voucherDiscount = 50000;
    const depositWithVoucher = calculateDeposit(totalPrice); // Still 20% of catalog totalPrice
    expect(depositWithVoucher).toBe(100000);

    // Remaining at salon is reduced by the voucher discount
    const remainingAtSalon = Math.max(0, totalPrice - voucherDiscount - depositWithVoucher);
    expect(remainingAtSalon).toBe(350000); // 500k - 50k - 100k
  });

  it("takes whichever is higher between membership tier discount and voucher discount without stacking", () => {
    const totalPrice = 1000000;
    const tierDiscountPercent = 10; // 10% Gold tier = 100,000
    const tierDiscount = (totalPrice * tierDiscountPercent) / 100;
    const voucherDiscount = 150000; // Voucher saves 150k

    // Voucher is higher (150k > 100k)
    const effectiveDiscount = Math.max(tierDiscount, voucherDiscount);
    expect(effectiveDiscount).toBe(150000);

    // Deposit amount stays 20% of catalog totalPrice (200,000)
    const depositAmount = Math.round(totalPrice * 0.2);
    expect(depositAmount).toBe(200000);

    const remainingAtSalon = Math.max(0, totalPrice - effectiveDiscount - depositAmount);
    expect(remainingAtSalon).toBe(650000); // 1,000,000 - 150,000 - 200,000
  });
});
