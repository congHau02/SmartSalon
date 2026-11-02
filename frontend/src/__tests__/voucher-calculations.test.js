import { describe, it, expect } from "vitest";
import {
  VOUCHER_ERROR_MESSAGES,
  resolveVoucherErrorMessage,
} from "../features/voucher/voucher.constants";
import { voucherFormSchema } from "../features/voucher/voucher.schema";

describe("Voucher Error Code Resolution", () => {
  it("resolves all defined error codes 5001 - 5010 accurately", () => {
    expect(resolveVoucherErrorMessage({ code: 5001 })).toBe("Không tìm thấy mã giảm giá");
    expect(resolveVoucherErrorMessage({ response: { data: { code: 5002 } } })).toBe(
      "Mã giảm giá đang tạm khóa hoặc không hoạt động"
    );
    expect(resolveVoucherErrorMessage({ code: 5003 })).toBe("Mã giảm giá chưa đến thời gian áp dụng");
    expect(resolveVoucherErrorMessage({ code: 5004 })).toBe("Mã giảm giá đã hết hạn sử dụng");
    expect(resolveVoucherErrorMessage({ code: 5005 })).toBe("Mã giảm giá không áp dụng tại chi nhánh này");
    expect(resolveVoucherErrorMessage({ code: 5006 })).toBe(
      "Đơn hàng chưa đạt giá trị tối thiểu để áp dụng mã"
    );
    expect(resolveVoucherErrorMessage({ code: 5007 })).toBe(
      "Mã giảm giá đã hết lượt sử dụng trên hệ thống"
    );
    expect(resolveVoucherErrorMessage({ code: 5008 })).toBe(
      "Bạn đã sử dụng hết lượt của mã giảm giá này"
    );
    expect(resolveVoucherErrorMessage({ code: 5009 })).toBe(
      "Mã giảm giá không còn hiệu lực tại thời điểm thanh toán"
    );
    expect(resolveVoucherErrorMessage({ code: 5010 })).toBe(
      "Mã giảm giá đã tồn tại trên hệ thống"
    );
  });

  it("handles fallback to response message or default message", () => {
    expect(
      resolveVoucherErrorMessage({
        response: { data: { code: 9999, message: "Lỗi đặc thù từ máy chủ" } },
      })
    ).toBe("Lỗi đặc thù từ máy chủ");

    expect(resolveVoucherErrorMessage(new Error("Lỗi mạng cục bộ"))).toBe("Lỗi mạng cục bộ");
    expect(resolveVoucherErrorMessage({})).toBe("Không thể áp dụng mã giảm giá");
  });
});

describe("Voucher Zod Schema Validation", () => {
  it("validates a well-formed fixed-amount voucher", () => {
    const validFixed = {
      code: "SUMMER50",
      name: "Khuyến mãi mùa hè 50K",
      description: "Giảm 50.000đ cho đơn từ 200k",
      type: "FIXED",
      value: 50000,
      minOrderAmount: 200000,
      perCustomerLimit: 2,
      branchIds: [1, 2],
    };
    const parsed = voucherFormSchema.safeParse(validFixed);
    expect(parsed.success).toBe(true);
  });

  it("validates a well-formed percent-based voucher", () => {
    const validPercent = {
      code: "VIP15",
      name: "Giảm 15% tối đa 100k",
      type: "PERCENT",
      value: 15,
      maxDiscount: 100000,
      minOrderAmount: 300000,
      perCustomerLimit: 1,
      branchIds: [],
    };
    const parsed = voucherFormSchema.safeParse(validPercent);
    expect(parsed.success).toBe(true);
  });

  it("rejects percentage vouchers with value > 100", () => {
    const invalidPercent = {
      code: "INVALID150",
      type: "PERCENT",
      value: 150,
      minOrderAmount: 0,
      perCustomerLimit: 1,
    };
    const parsed = voucherFormSchema.safeParse(invalidPercent);
    expect(parsed.success).toBe(false);
    expect(parsed.error?.issues[0]?.message).toContain("không được vượt quá 100%");
  });

  it("rejects invalid characters in voucher code", () => {
    const invalidCode = {
      code: "CODE WITH SPACES!",
      type: "FIXED",
      value: 30000,
      minOrderAmount: 0,
    };
    const parsed = voucherFormSchema.safeParse(invalidCode);
    expect(parsed.success).toBe(false);
    expect(parsed.error?.issues[0]?.message).toContain("Mã chỉ chứa");
  });
});

describe("Non-Stacking Discount Logic (max(tier, voucher))", () => {
  function computeBestDiscount({ subtotal, tierPercent, voucher }) {
    const tierDiscount = Math.round((subtotal * (tierPercent || 0)) / 100);
    let voucherDiscount = 0;

    if (voucher) {
      if (voucher.type === "FIXED") {
        voucherDiscount = voucher.value;
      } else if (voucher.type === "PERCENT") {
        let raw = (subtotal * voucher.value) / 100;
        if (voucher.maxDiscount && raw > voucher.maxDiscount) {
          raw = voucher.maxDiscount;
        }
        voucherDiscount = Math.round(raw);
      }
      voucherDiscount = Math.min(voucherDiscount, subtotal);
    }

    if (voucherDiscount > tierDiscount) {
      return {
        winner: "VOUCHER",
        discountAmount: voucherDiscount,
        voucherDiscount,
        tierDiscount,
      };
    } else if (tierDiscount > 0) {
      return {
        winner: "TIER",
        discountAmount: tierDiscount,
        voucherDiscount,
        tierDiscount,
      };
    }
    return {
      winner: "NONE",
      discountAmount: 0,
      voucherDiscount: 0,
      tierDiscount: 0,
    };
  }

  it("picks voucher when voucher discount exceeds tier discount", () => {
    // Subtotal 1,000,000; Silver tier = 5% (50,000); Voucher = 10% (100,000)
    const result = computeBestDiscount({
      subtotal: 1000000,
      tierPercent: 5,
      voucher: { type: "PERCENT", value: 10, maxDiscount: null },
    });
    expect(result.winner).toBe("VOUCHER");
    expect(result.discountAmount).toBe(100000);
    expect(result.tierDiscount).toBe(50000);
  });

  it("picks tier when tier discount exceeds voucher discount", () => {
    // Subtotal 1,000,000; Gold tier = 10% (100,000); Voucher fixed = 30,000
    const result = computeBestDiscount({
      subtotal: 1000000,
      tierPercent: 10,
      voucher: { type: "FIXED", value: 30000 },
    });
    expect(result.winner).toBe("TIER");
    expect(result.discountAmount).toBe(100000);
    expect(result.voucherDiscount).toBe(30000);
  });

  it("caps percentage voucher by maxDiscount", () => {
    // Subtotal 2,000,000; Standard tier = 0%; Voucher 20% cap 150,000
    const result = computeBestDiscount({
      subtotal: 2000000,
      tierPercent: 0,
      voucher: { type: "PERCENT", value: 20, maxDiscount: 150000 },
    });
    expect(result.winner).toBe("VOUCHER");
    expect(result.discountAmount).toBe(150000);
  });

  it("clamps discount to not exceed subtotal", () => {
    // Subtotal 50,000; Voucher fixed = 100,000
    const result = computeBestDiscount({
      subtotal: 50000,
      tierPercent: 0,
      voucher: { type: "FIXED", value: 100000 },
    });
    expect(result.winner).toBe("VOUCHER");
    expect(result.discountAmount).toBe(50000);
  });
});
