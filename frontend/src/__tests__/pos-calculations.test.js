import { describe, it, expect } from "vitest";
import { calculateClampedDiscount } from "../lib/utils";

describe("POS Financial Calculations - Clamped Discount", () => {
  it("clamps negative discount values to 0", () => {
    expect(calculateClampedDiscount(-10000, 100000, 0)).toBe(0);
    expect(calculateClampedDiscount("-5000", 200000, 20000)).toBe(0);
  });

  it("handles empty, null, undefined, or invalid inputs safely by returning 0", () => {
    expect(calculateClampedDiscount("", 100000, 0)).toBe(0);
    expect(calculateClampedDiscount(null, 100000, 0)).toBe(0);
    expect(calculateClampedDiscount(undefined, 100000, 0)).toBe(0);
    expect(calculateClampedDiscount("abc", 100000, 0)).toBe(0);
    expect(calculateClampedDiscount(NaN, 100000, 0)).toBe(0);
  });

  it("allows valid discounts within [0, subtotal - deposit]", () => {
    const subtotal = 500000;
    const deposit = 100000;
    // Max allowed is 400,000
    expect(calculateClampedDiscount(50000, subtotal, deposit)).toBe(50000);
    expect(calculateClampedDiscount("150000", subtotal, deposit)).toBe(150000);
    expect(calculateClampedDiscount(400000, subtotal, deposit)).toBe(400000);
  });

  it("caps discount at max(0, subtotal - deposit) when input exceeds remaining payable", () => {
    const subtotal = 300000;
    const deposit = 100000;
    // maxAllowed = 200,000
    expect(calculateClampedDiscount(250000, subtotal, deposit)).toBe(200000);
    expect(calculateClampedDiscount(9999999, subtotal, deposit)).toBe(200000);
  });

  it("caps discount at 0 when deposit exceeds or equals subtotal", () => {
    expect(calculateClampedDiscount(50000, 100000, 100000)).toBe(0);
    expect(calculateClampedDiscount(50000, 100000, 150000)).toBe(0);
  });

  it("computes final payable amount accurately with subtotal, deposit, and clamped discount", () => {
    const subtotal = 250000;
    const deposit = 50000;
    const rawDiscount = 70000;
    const clampedDiscount = calculateClampedDiscount(rawDiscount, subtotal, deposit);
    const finalAmount = Math.max(0, subtotal - deposit - clampedDiscount);

    expect(clampedDiscount).toBe(70000);
    expect(finalAmount).toBe(130000);
  });
});
