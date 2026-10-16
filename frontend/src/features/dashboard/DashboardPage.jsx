import React from "react";
import { Link } from "react-router-dom";
import { 
  CheckCircle2, 
  Database, 
  Server, 
  Cpu, 
  ShieldCheck, 
  LayoutDashboard, 
  Calendar, 
  Scissors, 
  Layers,
  ArrowRight
} from "lucide-react";
import { Card, Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";

export function DashboardPage() {
  const stackItems = [
    {
      title: "Backend Core",
      subtitle: "Java 25 LTS & Spring Boot 4.1",
      desc: "Kích hoạt Virtual Threads, kiến trúc Package-by-Feature, BaseEntity & ApiResponse Record",
      status: "Ready",
      icon: Server,
      color: "text-emerald-600 bg-emerald-50",
    },
    {
      title: "Bảo mật & Phân quyền",
      subtitle: "Spring Security 7 & Stateless JWT",
      desc: "JWT Authentication Filter, AuditorAware tự động gán created_by, RBAC 5 Roles",
      status: "Ready",
      icon: ShieldCheck,
      color: "text-blue-600 bg-blue-50",
    },
    {
      title: "Database & Migration",
      subtitle: "MySQL 9.7 & Flyway 11",
      desc: "V1__init_schema.sql tạo chuẩn 14 bảng quan hệ, UTF8mb4, khóa ngoại và chỉ mục",
      status: "Ready",
      icon: Database,
      color: "text-amber-600 bg-amber-50",
    },
    {
      title: "Frontend Shell",
      subtitle: "React 19 & Vite 8",
      desc: "Tailwind CSS v4 (@tailwindcss/vite), TanStack Query v5, React Router v7, axiosClient",
      status: "Ready",
      icon: LayoutDashboard,
      color: "text-pink-600 bg-pink-50",
    },
  ];

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-pink-500 via-rose-500 to-purple-600 rounded-2xl p-8 text-white shadow-md">
        <div className="max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-300" />
            <span>Phase 1: Khởi tạo Hạ tầng & Base Core Hoàn Tất</span>
          </div>
          <h2 className="text-3xl font-bold tracking-tight">
            SmartSalon - Nền tảng Đặt lịch & POS Salon Hiện đại
          </h2>
          <p className="text-pink-100 text-sm leading-relaxed">
            Hạ tầng Monorepo đã được đồng bộ với MySQL 9.7, Redis 8.4, Spring Boot 4 (Java 25 Virtual Threads), 
            và giao diện React 19 tối ưu hóa hiệu năng cao.
          </p>
          <div className="pt-2 flex flex-wrap gap-3">
            <Link to="/pos">
              <Button variant="secondary" className="bg-white text-pink-700 hover:bg-pink-50 font-semibold gap-2">
                <Scissors className="w-4 h-4" /> Bảng điều phối POS
              </Button>
            </Link>
            <Link to="/customer">
              <Button variant="outline" className="border-white/40 text-white hover:bg-white/10 gap-2">
                <Calendar className="w-4 h-4" /> Cổng khách hàng đặt lịch <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Core Infrastructure Grid */}
      <div>
        <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Layers className="w-5 h-5 text-pink-600" />
          Hạ tầng Base Core đã thiết lập (Phase 1)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {stackItems.map((item) => {
            const Icon = item.icon;
            return (
              <Card key={item.title} className="hover:border-pink-200 transition-all">
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-xl ${item.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-semibold text-slate-900">{item.title}</h4>
                      <Badge variant="success">{item.status}</Badge>
                    </div>
                    <div className="text-xs font-medium text-pink-600 mb-1">{item.subtitle}</div>
                    <p className="text-xs text-slate-500 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
