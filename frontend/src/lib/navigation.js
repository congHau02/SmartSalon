import {
  LayoutDashboard,
  Scissors,
  Package,
  Boxes,
  ClipboardList,
  CalendarCheck,
  TrendingUp,
  Users,
  AlertTriangle,
  DownloadCloud,
} from "lucide-react";

export const ADMIN_NAV_GROUPS = [
  {
    groupTitle: "Tài chính & Điều hành",
    items: [
      {
        label: "Bảng điều khiển & P&L",
        to: "/admin?tab=pnl",
        tab: "pnl",
        icon: TrendingUp,
      },
      {
        label: "Hiệu suất & Lương Nhân sự",
        to: "/admin?tab=staff",
        tab: "staff",
        icon: Users,
      },
      {
        label: "Cảnh báo Kho & Hao hụt BOM",
        to: "/admin?tab=inventory",
        tab: "inventory",
        icon: AlertTriangle,
      },
      {
        label: "Trung tâm Xuất Báo cáo",
        to: "/admin?tab=export",
        tab: "export",
        icon: DownloadCloud,
      },
    ],
  },
  {
    groupTitle: "Lịch hẹn & Điều phối",
    items: [
      {
        label: "Quản lý Lịch hẹn",
        to: "/admin/bookings",
        icon: CalendarCheck,
      },
    ],
  },
  {
    groupTitle: "Quản lý Dịch vụ",
    items: [
      {
        label: "Dịch vụ & Định mức BOM",
        to: "/admin/services",
        icon: Scissors,
      },
      {
        label: "Danh mục Master Product",
        to: "/admin/products",
        icon: Package,
      },
    ],
  },
  {
    groupTitle: "Quản lý Kho",
    items: [
      {
        label: "Tồn kho chi nhánh",
        to: "/admin/inventory",
        icon: Boxes,
        end: true,
      },
      {
        label: "Lịch sử giao dịch kho",
        to: "/admin/inventory/transactions",
        icon: ClipboardList,
      },
    ],
  },
];

/**
 * Helper to generate hierarchical breadcrumbs for the current pathname
 */
export function getBreadcrumbTrail(pathname) {
  const trail = [{ label: "SmartSalon", to: "/admin" }];

  if (pathname === "/" || pathname === "/admin") {
    trail.push({ label: "Bàn làm việc", to: "/admin" });
    return trail;
  }

  for (const group of ADMIN_NAV_GROUPS) {
    for (const item of group.items) {
      if (item.to === pathname || pathname.startsWith(item.to + "/")) {
        trail.push({ label: group.groupTitle });
        trail.push({ label: item.label, to: item.to });
        return trail;
      }
    }
  }

  trail.push({ label: "Hệ thống Quản trị" });
  return trail;
}
