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
import { BookingWizardPage } from "./features/booking/BookingWizardPage";
import { AdminBookingsPage } from "./features/booking/AdminBookingsPage";
import { CustomerServicesPage } from "./features/catalog/CustomerServicesPage";
import { CustomerProfilePage } from "./features/customer/CustomerProfilePage";
import { RealtimeProvider, RealtimeToastContainer } from "./features/realtime";
import { DispatchBoardPage } from "./features/pos/DispatchBoardPage";

export default function App() {
  return (
    <AuthProvider>
      <BranchProvider>
        <BrowserRouter>
          <RealtimeProvider>
            <RealtimeToastContainer />
            <Routes>
            {/* Public Auth Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/unauthorized" element={<UnauthorizedPage />} />

            {/* Public Shortcut Booking Routes */}
            <Route path="/booking" element={<Navigate to="/customer/booking" replace />} />

            {/* Customer Portal (Public / Semi-Public) */}
            <Route path="/customer" element={<CustomerLayout />}>
              <Route index element={<Navigate to="booking" replace />} />
              <Route path="booking" element={<BookingWizardPage />} />
              <Route path="services" element={<CustomerServicesPage />} />
              <Route path="profile" element={<CustomerProfilePage />} />
            </Route>

            {/* Protected Admin Portal */}
            <Route element={<RequireAuth />}>
              <Route element={<RoleGuard allowedRoles={["ADMIN", "MANAGER", "STAFF"]} />}>
                <Route path="/" element={<Navigate to="/admin" replace />} />
                <Route path="/admin" element={<AdminLayout />}>
                  <Route index element={<DashboardPage />} />
                  <Route path="bookings" element={<AdminBookingsPage />} />
                  <Route path="services" element={<ServicesPage />} />
                  <Route path="products" element={<ProductsPage />} />
                  <Route path="inventory" element={<BranchInventoryPage />} />
                  <Route path="inventory/transactions" element={<InventoryTransactionsPage />} />
                </Route>
              </Route>

              {/* Protected POS Dispatching */}
              <Route element={<RoleGuard allowedRoles={["ADMIN", "MANAGER", "STAFF", "STYLIST"]} />}>
                <Route path="/pos" element={<PosLayout />}>
                  <Route index element={<DispatchBoardPage />} />
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
                    <a href="/customer/booking" className="text-pink-600 hover:underline text-sm font-medium">
                      Trở về trang đặt lịch
                    </a>
                  </div>
                </div>
              }
            />
          </Routes>
          </RealtimeProvider>
        </BrowserRouter>
      </BranchProvider>
    </AuthProvider>
  );
}
