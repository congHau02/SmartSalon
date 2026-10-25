import { Calendar, Camera, Award, Crown, Sparkles, ShieldCheck } from "lucide-react";

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
    perks: "Giá dịch vụ niêm yết chuẩn, tích lũy chi tiêu từng đơn hàng.",
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

export const TIER_CONFIG = {
  STANDARD: {
    label: "STANDARD",
    name: "Chuẩn",
    discountPercent: 0,
    badgeClass: "bg-slate-100 text-slate-700 border-slate-200",
    icon: ShieldCheck,
  },
  SILVER: {
    label: "SILVER",
    name: "Bạc",
    discountPercent: 5,
    badgeClass: "bg-gradient-to-r from-slate-100 to-zinc-200 text-slate-800 border-slate-300 shadow-2xs",
    icon: Award,
  },
  GOLD: {
    label: "GOLD",
    name: "Vàng",
    discountPercent: 10,
    badgeClass: "bg-gradient-to-r from-amber-50 to-amber-100 text-amber-900 border-amber-300 shadow-2xs",
    icon: Crown,
  },
  DIAMOND: {
    label: "DIAMOND",
    name: "Kim Cương",
    discountPercent: 15,
    badgeClass: "bg-gradient-to-r from-cyan-50 to-blue-100 text-blue-900 border-cyan-300 shadow-2xs",
    icon: Sparkles,
  },
};
