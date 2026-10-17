import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../features/auth/useAuth";

export function RoleGuard({ allowedRoles = [] }) {
  const { user, hasAnyRole } = useAuth();

  if (!user || !hasAnyRole(allowedRoles)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
}
