import { describe, it, expect } from "vitest";
import { mapTimelineItems } from "../features/pos/timeline.utils";

describe("TimelineBoard Multi-Stylist Lane & Duration Mapping", () => {
  it("computes default booking duration as 30 minutes when totalDurationMinutes is absent", () => {
    const bookingTime = "2026-10-21T09:00:00Z";
    const bookings = [
      {
        id: 1,
        bookingCode: "BK01",
        staffId: 101,
        bookingTime,
      },
    ];

    const result = mapTimelineItems({ bookings, orders: [] });
    expect(result).toHaveLength(1);
    expect(result[0].endTime.getTime() - result[0].startTime.getTime()).toBe(30 * 60000);
  });

  it("calculates order duration based on sum of service durationMinutes", () => {
    const createdAt = "2026-10-21T10:00:00Z";
    const orders = [
      {
        id: 99,
        orderCode: "ORD-99",
        createdAt,
        items: [
          { itemType: "SERVICE", durationMinutes: 30, steps: [{ staffId: 5 }] },
          { itemType: "SERVICE", durationMinutes: 45, steps: [{ staffId: 5 }] },
          { itemType: "PRODUCT", durationMinutes: 10 }, // should be ignored in duration
        ],
      },
    ];

    const result = mapTimelineItems({ bookings: [], orders });
    expect(result).toHaveLength(1);
    expect(result[0].durationMinutes).toBe(75);
    expect(result[0].endTime.getTime() - result[0].startTime.getTime()).toBe(75 * 60000);
  });

  it("falls back to 45 minutes order duration when items have 0 or missing durationMinutes", () => {
    const orders = [
      {
        id: 100,
        createdAt: "2026-10-21T10:00:00Z",
        items: [{ itemType: "SERVICE", steps: [{ staffId: 5 }] }],
      },
    ];

    const result = mapTimelineItems({ bookings: [], orders });
    expect(result).toHaveLength(1);
    expect(result[0].durationMinutes).toBe(45);
  });

  it("duplicates order into multiple stylist lanes when steps are assigned to multiple staff", () => {
    const orders = [
      {
        id: 101,
        orderCode: "ORD-101",
        createdAt: "2026-10-21T14:00:00Z",
        items: [
          {
            itemType: "SERVICE",
            durationMinutes: 60,
            steps: [
              { stepOrder: 1, staffId: 10 }, // Stylist A
              { stepOrder: 2, staffId: 20 }, // Stylist B
              { stepOrder: 3, staffId: 10 }, // Stylist A again (deduplicated)
            ],
          },
        ],
      },
    ];

    const result = mapTimelineItems({ bookings: [], orders });
    expect(result).toHaveLength(2);
    expect(result.map((r) => r.staffId).sort()).toEqual([10, 20]);
    expect(result.map((r) => r.id)).toEqual(["101-10", "101-20"]);
  });

  it("ignores orders without any assigned staff", () => {
    const orders = [
      {
        id: 102,
        createdAt: "2026-10-21T14:00:00Z",
        items: [{ itemType: "SERVICE", durationMinutes: 30, steps: [] }],
      },
    ];

    const result = mapTimelineItems({ bookings: [], orders });
    expect(result).toHaveLength(0);
  });
});
