/**
 * Map upcoming bookings and active orders to timeline schedule items.
 * Orders with multi-staff steps are placed in each assigned stylist's lane.
 * Service items determine the order duration (fallback 45 min).
 */
export function mapTimelineItems({ bookings = [], orders = [] }) {
  const list = [];

  // Bookings
  bookings.forEach((b) => {
    if (b.bookingTime && b.staffId) {
      list.push({
        type: "BOOKING",
        id: b.id,
        code: b.bookingCode,
        staffId: b.staffId,
        customerName: b.customerName,
        customerPhone: b.customerPhone,
        startTime: new Date(b.bookingTime),
        endTime: b.endTime
          ? new Date(b.endTime)
          : new Date(new Date(b.bookingTime).getTime() + (b.totalDurationMinutes || 30) * 60000),
        status: b.status,
        totalPrice: b.totalPrice,
        services: b.serviceNames?.join(", "),
        raw: b,
      });
    }
  });

  // Orders: map across every distinct assigned stylist and compute real duration
  orders.forEach((o) => {
    if (!o.createdAt) return;

    const serviceItems = (o.items || []).filter(
      (i) => i.itemType === "SERVICE" || i.type === "SERVICE" || (!i.itemType && !i.type)
    );
    const totalDuration = serviceItems.reduce(
      (acc, i) => acc + (Number(i.durationMinutes) || 0),
      0
    );
    const durationMinutes = totalDuration > 0 ? totalDuration : 45;

    const allSteps = (o.items || []).flatMap((i) => i.steps || []);
    const uniqueStaffIds = Array.from(
      new Set(allSteps.map((s) => s.staffId).filter((id) => id != null))
    );

    if (uniqueStaffIds.length === 0) return;

    const start = new Date(o.createdAt);
    const end = new Date(start.getTime() + durationMinutes * 60000);

    uniqueStaffIds.forEach((staffId) => {
      list.push({
        type: "ORDER",
        id: `${o.id}-${staffId}`,
        orderId: o.id,
        code: o.orderCode,
        staffId,
        customerName: o.customerName,
        customerPhone: o.customerPhone,
        startTime: start,
        endTime: end,
        durationMinutes,
        status: o.status,
        totalPrice: o.finalAmount,
        raw: o,
      });
    });
  });

  return list;
}
