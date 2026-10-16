import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AdminLayout } from "./components/layout/AdminLayout";
import { PosLayout } from "./components/layout/PosLayout";
import { CustomerLayout } from "./components/layout/CustomerLayout";
import { DashboardPage } from "./features/dashboard/DashboardPage";

function PosPlaceholder() {
  return (
    <div className="p-8 text-center bg-slate-800 rounded-xl border border-slate-700">
      <h3 className="text-xl font-bold mb-2">Bảng điều phối Ghế / Giường (Kanban & Timeline)</h3>
      <p className="text-slate-400 text-sm">
        Tính năng thuộc Phase 2 - POS & Điều phối tại quầy. Sẽ tích hợp WebSocket STOMP thời gian thực.
      </p>
    </div>
  );
}

function CustomerBookingPlaceholder() {
  return (
    <div className="p-8 text-center bg-white rounded-xl border border-pink-200 shadow-sm">
      <h3 className="text-xl font-bold text-pink-700 mb-2">Cổng Đặt Lịch Hẹn Khách Hàng (Smart Booking)</h3>
      <p className="text-slate-500 text-sm">
        Tính năng thuộc Phase 2 - Xử lý giữ slot tạm thời (5 phút) và thanh toán đặt cọc VietQR.
      </p>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Admin Portal Layout */}
        <Route path="/" element={<AdminLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="staff" element={<div className="p-6 bg-white rounded-xl border">Quản lý nhân sự & hoa hồng</div>} />
          <Route path="inventory" element={<div className="p-6 bg-white rounded-xl border">Kho định mức (BOM)</div>} />
        </Route>

        {/* POS Dispatching Layout */}
        <Route path="/pos" element={<PosLayout />}>
          <Route index element={<PosPlaceholder />} />
        </Route>

        {/* Customer Portal Layout */}
        <Route path="/customer" element={<CustomerLayout />}>
          <Route index element={<CustomerBookingPlaceholder />} />
          <Route path="booking" element={<CustomerBookingPlaceholder />} />
          <Route path="services" element={<div className="p-6 bg-white rounded-xl border">Bảng giá dịch vụ</div>} />
        </Route>

        {/* Fallback */}
        <Route
          path="*"
          element={
            <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-700">
              <div className="text-center">
                <h1 className="text-4xl font-bold mb-2">404</h1>
                <p>Trang không tồn tại</p>
              </div>
            </div>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
