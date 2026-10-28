export const QUERY_KEYS = {
  booking: ["booking"],
  pos: ["pos"],
  dispatch: ["dispatch"],
  posBoard: (branchId, date) => ["pos-board", branchId, date],
  order: (orderId) => (orderId != null ? ["order", orderId] : ["order"]),
  visualLog: (orderId) => (orderId != null ? ["visual-log", orderId] : ["visual-log"]),
  posVietQr: (orderId, discountAmount = 0) => ["pos-vietqr", orderId, discountAmount],
  commissionLedger: (branchId, date) =>
    branchId != null ? ["commission-ledger", branchId, date] : ["commission-ledger"],
  commissionLedgerDaily: (branchId, date) =>
    branchId != null ? ["commission-ledger", branchId, date] : ["commission-ledger"],
  analyticsPnl: ["analytics-pnl"],
  analyticsStaffPayroll: ["analytics-staff-payroll"],
  analyticsInventoryAlerts: ["analytics-inventory-alerts"],
  myPayroll: ["my-payroll"],
  stylistDailyWorklog: (branchId, stylistId, date) => [
    "stylist-daily-worklog",
    branchId,
    stylistId,
    date,
  ],
  posTodayAttendance: (branchId) =>
    branchId != null ? ["pos-today-attendance", branchId] : ["pos-today-attendance"],
};

export function invalidateRealtimeCaches(queryClient) {
  if (!queryClient) return;
  const keysToInvalidate = [
    QUERY_KEYS.booking,
    QUERY_KEYS.pos,
    QUERY_KEYS.dispatch,
    ["pos-today-attendance"],
    QUERY_KEYS.order(),
    QUERY_KEYS.commissionLedger(),
    ["stylist-daily-worklog"],
    QUERY_KEYS.analyticsPnl,
    QUERY_KEYS.analyticsStaffPayroll,
    QUERY_KEYS.analyticsInventoryAlerts,
    QUERY_KEYS.myPayroll,
  ];
  for (const queryKey of keysToInvalidate) {
    queryClient.invalidateQueries({ queryKey });
  }
}
