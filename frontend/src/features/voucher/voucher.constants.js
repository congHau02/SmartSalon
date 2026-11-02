export const VOUCHER_TYPES = [
  { value: "PERCENT", label: "Phần trăm (%)" },
  { value: "FIXED", label: "Số tiền cố định (VNĐ)" },
];

export const VOUCHER_ERROR_MESSAGES = {
  5001: "Không tìm thấy mã giảm giá",
  5002: "Mã giảm giá đang tạm khóa hoặc không hoạt động",
  5003: "Mã giảm giá chưa đến thời gian áp dụng",
  5004: "Mã giảm giá đã hết hạn sử dụng",
  5005: "Mã giảm giá không áp dụng tại chi nhánh này",
  5006: "Đơn hàng chưa đạt giá trị tối thiểu để áp dụng mã",
  5007: "Mã giảm giá đã hết lượt sử dụng trên hệ thống",
  5008: "Bạn đã sử dụng hết lượt của mã giảm giá này",
  5009: "Mã giảm giá không còn hiệu lực tại thời điểm thanh toán",
  5010: "Mã giảm giá đã tồn tại trên hệ thống",
};

export function resolveVoucherErrorMessage(error) {
  const code = error?.response?.data?.code || error?.code;
  if (code && VOUCHER_ERROR_MESSAGES[code]) {
    return VOUCHER_ERROR_MESSAGES[code];
  }
  return error?.response?.data?.message || error?.message || "Không thể áp dụng mã giảm giá";
}

export const DEFAULT_VOUCHER_VALUES = {
  code: "",
  name: "",
  description: "",
  type: "FIXED",
  value: 50000,
  maxDiscount: "",
  minOrderAmount: 0,
  startsAt: "",
  endsAt: "",
  usageLimit: "",
  perCustomerLimit: 1,
  branchIds: [],
};
