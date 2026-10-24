import { describe, it, expect } from "vitest";
import { TIER_CONFIG } from "../components/common/MembershipTierBadge";

describe("Membership Tier Configuration and Discounts", () => {
  it("defines all 4 membership tiers with expected discount rates", () => {
    expect(TIER_CONFIG.STANDARD.discountPercent).toBe(0);
    expect(TIER_CONFIG.SILVER.discountPercent).toBe(5);
    expect(TIER_CONFIG.GOLD.discountPercent).toBe(10);
    expect(TIER_CONFIG.DIAMOND.discountPercent).toBe(15);
  });

  it("calculates correct tier discounts across typical salon order totals", () => {
    const subtotal = 1000000; // 1,000,000 VND

    const silverDiscount = (subtotal * TIER_CONFIG.SILVER.discountPercent) / 100;
    const goldDiscount = (subtotal * TIER_CONFIG.GOLD.discountPercent) / 100;
    const diamondDiscount = (subtotal * TIER_CONFIG.DIAMOND.discountPercent) / 100;
    const standardDiscount = (subtotal * TIER_CONFIG.STANDARD.discountPercent) / 100;

    expect(standardDiscount).toBe(0);
    expect(silverDiscount).toBe(50000);
    expect(goldDiscount).toBe(100000);
    expect(diamondDiscount).toBe(150000);
  });

  it("handles case-insensitive or missing tier safely", () => {
    const normalize = (tier) => TIER_CONFIG[tier?.toUpperCase()] || TIER_CONFIG.STANDARD;

    expect(normalize("silver").label).toBe("SILVER");
    expect(normalize(null).label).toBe("STANDARD");
    expect(normalize(undefined).label).toBe("STANDARD");
    expect(normalize("UNKNOWN").label).toBe("STANDARD");
  });
});
