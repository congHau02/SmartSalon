import { Calendar, Camera, Award } from "lucide-react";

export const CUSTOMER_TABS = [
  { id: "bookings", label: "Lịch hẹn của tôi", icon: Calendar },
  { id: "orders", label: "Lịch sử & Visual Log", icon: Camera },
  { id: "loyalty", label: "Hạng thành viên & Quyền lợi", icon: Award },
];

export const TIERS_MATRIX = [
  {
    tier: "STANDARD",
    name: "Standard",
    minSpend: 0,
    discountPercent: 0,
    perks: "Giá dịch vụ niêm yết chuẩn, tích lũy điểm từng đơn hàng.",
  },
  {
    tier: "SILVER",
    name: "Silver VIP",
    minSpend: 2000000,
    discountPercent: 5,
    perks: "Giảm tự động 5% cho toàn bộ dịch vụ, ưu tiên giữ chỗ trực tuyến.",
  },
  {
    tier: "GOLD",
    name: "Gold VIP",
    minSpend: 5000000,
    discountPercent: 10,
    perks: "Giảm tự động 10% dịch vụ, ưu tiên chọn Top Stylist theo yêu cầu.",
  },
  {
    tier: "DIAMOND",
    name: "Diamond Elite",
    minSpend: 10000000,
    discountPercent: 15,
    perks: "Giảm tự động 15% dịch vụ, bảo lưu cọc vĩnh viễn, phục vụ phòng VIP riêng.",
  },
];
