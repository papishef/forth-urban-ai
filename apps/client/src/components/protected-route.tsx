import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import type { UserRole } from "@forth-urban/shared-types";
import { useAuth } from "../lib/auth-context";

export function ProtectedRoute({ children, role }: { children: ReactNode; role?: UserRole }) {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FFECE4]">
        <p className="text-[#181818]">Loading…</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (role && user?.role !== role) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
