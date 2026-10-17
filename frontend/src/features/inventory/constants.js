import {
  ArrowDownToLine,
  Scale,
  PackageOpen,
  FlaskConical,
} from "lucide-react";

// Packaging units for commercial salon products
export const PACKAGING_UNITS = [
  "Chai",
  "Hộp",
  "Tuýp",
  "Lọ",
  "Can",
  "Gói",
  "Hũ",
  "Cái",
];

// Volume/Weight measurement units for consumable chemical tracking
export const VOLUME_UNITS = [
  "ml",
  "gram",
  "lít",
  "kg",
  "viên",
  "miếng",
];

// Predefined reasons for stocktaking and inventory adjustment
export const ADJUSTMENT_REASONS = [
  "Hao hụt tự nhiên trong quá trình pha chế",
  "Đổ vỡ / Hư hỏng bao bì tại quầy",
  "Hết hạn sử dụng (Cần hủy bỏ)",
  "Kiểm kê định kỳ cân đối lại kho",
  "Sai lệch số liệu khi nhân viên mở seal",
  "Lý do khác...",
];

// Transaction types visual badge and icon configuration
export const TRANSACTION_TYPE_CONFIG = {
  STOCK_IN: {
    label: "Nhập kho mới",
    badgeClass: "bg-emerald-50 text-emerald-800 border-emerald-200/80",
    icon: ArrowDownToLine,
  },
  STOCK_ADJUSTMENT: {
    label: "Kiểm kê / Cân đối",
    badgeClass: "bg-amber-50 text-amber-800 border-amber-200/80",
    icon: Scale,
  },
  AUTO_UNSEAL: {
    label: "Tự động khui nắp (Unseal)",
    badgeClass: "bg-purple-50 text-purple-800 border-purple-200/80",
    icon: PackageOpen,
  },
  SERVICE_CONSUMPTION: {
    label: "Xuất dùng dịch vụ (BOM)",
    badgeClass: "bg-pink-50 text-pink-800 border-pink-200/80",
    icon: FlaskConical,
  },
};
