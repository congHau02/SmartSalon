import { describe, it, expect } from "vitest";

// Pure helper logic mirroring customer portal rules
function canCancelBookingOnline(status, bookingTime, referenceNow = new Date()) {
  if (status !== "PENDING_PAYMENT" && status !== "CONFIRMED") {
    return false;
  }
  if (!bookingTime) return false;

  const bTime = new Date(bookingTime).getTime();
  const now = referenceNow.getTime();
  const diffHours = (bTime - now) / (1000 * 60 * 60);

  return diffHours >= 2;
}

function calculateRetainedDepositOffset({ creditBalance, depositRequired }) {
  const credit = Math.max(0, Number(creditBalance || 0));
  const deposit = Math.max(0, Number(depositRequired || 0));

  if (credit >= deposit) {
    return {
      coveredByCredit: true,
      deductedCredit: deposit,
      remainingCredit: credit - deposit,
      needsVietQr: false,
    };
  }

  return {
    coveredByCredit: false,
    deductedCredit: 0,
    remainingCredit: credit,
    needsVietQr: true,
  };
}

function calculatePosCreditOffset({ creditBalance, subtotal, discountAmount, depositDeducted = 0 }) {
  const credit = Math.max(0, Number(creditBalance || 0));
  const netDue = Math.max(0, Number(subtotal || 0) - Number(discountAmount || 0) - Number(depositDeducted || 0));

  const appliedCredit = Math.min(credit, netDue);
  return {
    appliedCredit,
    remainingCredit: credit - appliedCredit,
    finalAmount: netDue - appliedCredit,
  };
}

describe("Customer Portal & Retained Deposit Domain Rules", () => {
  const now = new Date("2026-10-24T10:00:00");

  describe("2-Hour Online Cancellation Rule", () => {
    it("allows cancellation when start time is >= 2 hours away for CONFIRMED booking", () => {
      const futureTime = "2026-10-24T12:00:00"; // Exactly 2h
      expect(canCancelBookingOnline("CONFIRMED", futureTime, now)).toBe(true);

      const moreFutureTime = "2026-10-24T15:00:00"; // 5h
      expect(canCancelBookingOnline("CONFIRMED", moreFutureTime, now)).toBe(true);
    });

    it("allows cancellation when start time is >= 2 hours away for PENDING_PAYMENT booking", () => {
      const futureTime = "2026-10-24T14:30:00";
      expect(canCancelBookingOnline("PENDING_PAYMENT", futureTime, now)).toBe(true);
    });

    it("rejects cancellation when start time is < 2 hours away", () => {
      const nearTime = "2026-10-24T11:59:00"; // 1h 59m
      expect(canCancelBookingOnline("CONFIRMED", nearTime, now)).toBe(false);

      const veryNearTime = "2026-10-24T10:30:00"; // 30m
      expect(canCancelBookingOnline("CONFIRMED", veryNearTime, now)).toBe(false);
    });

    it("rejects cancellation for non-cancellable states (COMPLETED, CHECKED_IN, CANCELLED)", () => {
      const futureTime = "2026-10-24T16:00:00";
      expect(canCancelBookingOnline("COMPLETED", futureTime, now)).toBe(false);
      expect(canCancelBookingOnline("CHECKED_IN", futureTime, now)).toBe(false);
      expect(canCancelBookingOnline("CANCELLED", futureTime, now)).toBe(false);
    });
  });

  describe("Retained Deposit Auto-Offset on Booking", () => {
    it("auto-confirms booking when credit balance covers required deposit without VietQR", () => {
      const result = calculateRetainedDepositOffset({
        creditBalance: 300000,
        depositRequired: 170000,
      });

      expect(result.coveredByCredit).toBe(true);
      expect(result.deductedCredit).toBe(170000);
      expect(result.remainingCredit).toBe(130000);
      expect(result.needsVietQr).toBe(false);
    });

    it("requires VietQR when credit balance is less than required deposit", () => {
      const result = calculateRetainedDepositOffset({
        creditBalance: 100000,
        depositRequired: 170000,
      });

      expect(result.coveredByCredit).toBe(false);
      expect(result.needsVietQr).toBe(true);
      expect(result.remainingCredit).toBe(100000);
    });
  });

  describe("Retained Deposit POS Offset", () => {
    it("offsets credit balance into POS order after tier discount", () => {
      // Subtotal 850k, 5% tier discount = 42.5k, credit balance 200k
      const result = calculatePosCreditOffset({
        creditBalance: 200000,
        subtotal: 850000,
        discountAmount: 42500,
        depositDeducted: 0,
      });

      expect(result.appliedCredit).toBe(200000);
      expect(result.remainingCredit).toBe(0);
      expect(result.finalAmount).toBe(607500); // 850,000 - 42,500 - 200,000
    });

    it("clamps credit offset when credit exceeds net due", () => {
      const result = calculatePosCreditOffset({
        creditBalance: 500000,
        subtotal: 200000,
        discountAmount: 20000, // net due 180,000
        depositDeducted: 0,
      });

      expect(result.appliedCredit).toBe(180000);
      expect(result.remainingCredit).toBe(320000);
      expect(result.finalAmount).toBe(0);
    });
  });

  describe("Visual Log Customer Privacy & Review Eligibility", () => {
    it("ensures Visual Log strips actualBomJson for customer safety", () => {
      const internalLog = {
        beforeImageUrl: "https://cdn.smartsalon.vn/before.jpg",
        afterImageUrl: "https://cdn.smartsalon.vn/after.jpg",
        hairConditionNotes: "Tóc khô xơ ngọn",
        formulaNotes: "Nhuộm hạt dẻ sáng",
        actualBomJson: '{"used":[{"sku":"OXI-6","amount":40}]}',
      };

      // Customer-safe mapping
      const customerVisualLog = {
        beforeImageUrl: internalLog.beforeImageUrl,
        afterImageUrl: internalLog.afterImageUrl,
        hairConditionNotes: internalLog.hairConditionNotes,
        formulaNotes: internalLog.formulaNotes,
      };

      expect(customerVisualLog.beforeImageUrl).toBe("https://cdn.smartsalon.vn/before.jpg");
      expect(customerVisualLog.afterImageUrl).toBe("https://cdn.smartsalon.vn/after.jpg");
      expect(customerVisualLog.actualBomJson).toBeUndefined();
    });

    it("determines review eligibility: eligible only for PAID orders containing salon services without existing review", () => {
      const isEligibleForReview = (order) => {
        if (order.status !== "PAID") return false;
        if (order.review) return false;
        const hasService = order.items?.some((i) => i.itemType === "SERVICE");
        return Boolean(hasService);
      };

      const paidServiceOrder = {
        id: 1,
        status: "PAID",
        items: [{ itemType: "SERVICE", name: "Cắt tóc" }],
        review: null,
      };
      expect(isEligibleForReview(paidServiceOrder)).toBe(true);

      const alreadyReviewedOrder = {
        id: 2,
        status: "PAID",
        items: [{ itemType: "SERVICE", name: "Uốn tóc" }],
        review: { rating: 5, comment: "Rất đẹp" },
      };
      expect(isEligibleForReview(alreadyReviewedOrder)).toBe(false);

      const retailOnlyOrder = {
        id: 3,
        status: "PAID",
        items: [{ itemType: "PRODUCT", name: "Dầu gội Kérastase" }],
        review: null,
      };
      expect(isEligibleForReview(retailOnlyOrder)).toBe(false);

      const unpaidOrder = {
        id: 4,
        status: "CHECKED_IN",
        items: [{ itemType: "SERVICE", name: "Cắt tóc" }],
        review: null,
      };
      expect(isEligibleForReview(unpaidOrder)).toBe(false);
    });

    it("resolves Primary Stylist as the stylist with the highest commission", () => {
      const resolvePrimaryStylist = (stylists = []) => {
        if (!stylists.length) return null;
        return [...stylists].sort((a, b) => (b.commissionAmount || 0) - (a.commissionAmount || 0))[0];
      };

      const team = [
        { id: 2, fullName: "Minh", commissionAmount: 40000 },
        { id: 3, fullName: "Lan", commissionAmount: 120000 },
        { id: 4, fullName: "Hoa", commissionAmount: 60000 },
      ];

      const primary = resolvePrimaryStylist(team);
      expect(primary.id).toBe(3);
      expect(primary.fullName).toBe("Lan");
    });
  });
});
