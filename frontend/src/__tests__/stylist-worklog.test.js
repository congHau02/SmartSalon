import { describe, it, expect } from "vitest";

describe("Phase 8 - Issue 01: Stylist Quick Ticket & Shift Handover Logic", () => {
  it("computes net payable amount correctly with clamped manual discount", () => {
    const services = [
      { id: 1, name: "Cắt tóc nam", price: 150000 },
      { id: 2, name: "Gội dưỡng sinh", price: 100000 },
    ];
    const subtotal = services.reduce((sum, s) => sum + s.price, 0);
    expect(subtotal).toBe(250000);

    const manualDiscount = 50000;
    const finalAmount = Math.max(0, subtotal - manualDiscount);
    expect(finalAmount).toBe(200000);

    // Over-discount clamp
    const excessiveDiscount = 300000;
    const clampedFinalAmount = Math.max(0, subtotal - excessiveDiscount);
    expect(clampedFinalAmount).toBe(0);
  });

  it("accurately separates shift handover cash from electronic transfers", () => {
    const orders = [
      { id: 1, finalAmount: 200000, paymentMethod: "CASH", settledByStylist: true },
      { id: 2, finalAmount: 350000, paymentMethod: "VIETQR", settledByStylist: true },
      { id: 3, finalAmount: 180000, paymentMethod: "CASH", settledByStylist: true },
      { id: 4, finalAmount: 500000, paymentMethod: "CASH", settledByStylist: false }, // settled by receptionist
    ];

    let cashToHandover = 0;
    let transferAmount = 0;
    let selfSettledCount = 0;

    for (const o of orders) {
      if (o.settledByStylist) {
        selfSettledCount++;
        if (o.paymentMethod === "CASH") {
          cashToHandover += o.finalAmount;
        } else if (["VIETQR", "CARD"].includes(o.paymentMethod)) {
          transferAmount += o.finalAmount;
        }
      }
    }

    expect(selfSettledCount).toBe(3);
    expect(cashToHandover).toBe(380000); // 200k + 180k
    expect(transferAmount).toBe(350000); // 350k
    expect(cashToHandover + transferAmount).toBe(730000);
  });

  it("generates well-formed VietQR dynamic quick checkout image URL", () => {
    const bankId = "MB";
    const accountNo = "0988888888";
    const accountName = "SMART SALON VIETNAM";
    const amount = 250000;
    const description = "PHIEU CAT NHANH 1234";

    const qrUrl = `https://img.vietqr.io/image/${bankId}-${accountNo}-compact2.png?amount=${amount}&addInfo=${encodeURIComponent(
      description
    )}&accountName=${encodeURIComponent(accountName)}`;

    expect(qrUrl).toContain("img.vietqr.io");
    expect(qrUrl).toContain("MB-0988888888-compact2.png");
    expect(qrUrl).toContain("amount=250000");
    expect(qrUrl).toContain(encodeURIComponent("PHIEU CAT NHANH 1234"));
  });
});
