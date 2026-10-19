export const QUERY_KEYS = {
  booking: ["booking"],
  pos: ["pos"],
  dispatch: ["dispatch"],
  order: (orderId) => (orderId != null ? ["order", orderId] : ["order"]),
  visualLog: (orderId) => (orderId != null ? ["visual-log", orderId] : ["visual-log"]),
  posVietQr: (orderId, discountAmount = 0) => ["pos-vietqr", orderId, discountAmount],
  commissionLedger: (branchId, date) =>
    branchId != null ? ["commission-ledger", branchId, date] : ["commission-ledger"],
  analyticsPnl: ["analytics-pnl"],
  analyticsStaffPayroll: ["analytics-staff-payroll"],
  analyticsInventoryAlerts: ["analytics-inventory-alerts"],
};

export function invalidateRealtimeCaches(queryClient) {
  if (!queryClient) return;
  const keysToInvalidate = [
    QUERY_KEYS.booking,
    QUERY_KEYS.pos,
    QUERY_KEYS.dispatch,
    QUERY_KEYS.order(),
    QUERY_KEYS.commissionLedger(),
    QUERY_KEYS.analyticsPnl,
    QUERY_KEYS.analyticsStaffPayroll,
    QUERY_KEYS.analyticsInventoryAlerts,
  ];
  for (const queryKey of keysToInvalidate) {
    queryClient.invalidateQueries({ queryKey });
  }
}
