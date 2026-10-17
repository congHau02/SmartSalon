import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./features/auth/AuthContext";
import { BranchProvider } from "./features/branch/BranchContext";
import { LoginPage } from "./features/auth/LoginPage";
import { RegisterPage } from "./features/auth/RegisterPage";
import { UnauthorizedPage } from "./features/auth/UnauthorizedPage";
import { RequireAuth } from "./components/auth/RequireAuth";
import { RoleGuard } from "./components/auth/RoleGuard";
import { AdminLayout } from "./components/layout/AdminLayout";
import { PosLayout } from "./components/layout/PosLayout";
import { CustomerLayout } from "./components/layout/CustomerLayout";
import { DashboardPage } from "./features/dashboard/DashboardPage";
import { ServicesPage } from "./features/catalog/ServicesPage";
import { ProductsPage } from "./features/inventory/ProductsPage";
import { BranchInventoryPage } from "./features/inventory/BranchInventoryPage";
import { InventoryTransactionsPage } from "./features/inventory/InventoryTransactionsPage";

function PosPlaceholder() {
  return (
    <div className="p-8 text-center bg-slate-800 rounded-xl border border-slate-700">
      <h3 className="text-xl font-bold mb-2">Bảng điều phối Ghế / Giường (Kanban & Timeline)</h3>
      <p className="text-slate-400 text-sm">
        Tính năng thuộc POS & Điều phối tại quầy. Sẽ tích hợp WebSocket STOMP thời gian thực.
      </p>
    </div>
  );
}

function CustomerBookingPlaceholder() {
  return (
    <div className="p-8 text-center bg-white rounded-xl border border-pink-200 shadow-sm">
      <h3 className="text-xl font-bold text-pink-700 mb-2">Cổng Đặt lịch Khách Hàng (Smart Booking)</h3>
      <p className="text-slate-500 text-sm">
        Tính năng xử lý giữ slot tạm thời (5 phút) và thanh toán đặt cọc VietQR.
      </p>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BranchProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Auth Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/unauthorized" element={<UnauthorizedPage />} />

            {/* Customer Portal (Public / Semi-Public) */}
            <Route path="/customer" element={<CustomerLayout />}>
              <Route index element={<CustomerBookingPlaceholder />} />
              <Route path="booking" element={<CustomerBookingPlaceholder />} />
              <Route path="services" element={<div className="p-6 bg-white rounded-xl border">Bảng giá dịch vụ</div>} />
            </Route>

            {/* Protected Admin Portal */}
            <Route element={<RequireAuth />}>
              <Route element={<RoleGuard allowedRoles={["ADMIN", "MANAGER", "STAFF"]} />}>
                <Route path="/" element={<Navigate to="/admin" replace />} />
                <Route path="/admin" element={<AdminLayout />}>
                  <Route index element={<DashboardPage />} />
                  <Route path="services" element={<ServicesPage />} />
                  <Route path="products" element={<ProductsPage />} />
                  <Route path="inventory" element={<BranchInventoryPage />} />
                  <Route path="inventory/transactions" element={<InventoryTransactionsPage />} />
                </Route>
              </Route>

              {/* Protected POS Dispatching */}
              <Route element={<RoleGuard allowedRoles={["ADMIN", "MANAGER", "STAFF", "STYLIST"]} />}>
                <Route path="/pos" element={<PosLayout />}>
                  <Route index element={<PosPlaceholder />} />
                </Route>
              </Route>
            </Route>

            {/* 404 Fallback */}
            <Route
              path="*"
              element={
                <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-700">
                  <div className="text-center">
                    <h1 className="text-4xl font-bold mb-2">404</h1>
                    <p className="mb-4">Trang không tồn tại</p>
                    <a href="/" className="text-pink-600 hover:underline text-sm font-medium">
                      Trở về trang chủ
                    </a>
                  </div>
                </div>
              }
            />
          </Routes>
        </BrowserRouter>
      </BranchProvider>
    </AuthProvider>
  );
}
