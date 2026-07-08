import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import type { UserRole } from "@forth-urban/shared-types";
import { BuildingLoader } from "@forth-urban/ui";
import { useAuth } from "../lib/auth-context";

export function ProtectedRoute({
  children,
  role,
}: {
  children: ReactNode;
  role?: UserRole | UserRole[];
}) {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FFECE4]">
        <BuildingLoader size="lg" label="Loading…" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const allowedRoles = role ? (Array.isArray(role) ? role : [role]) : null;
  if (allowedRoles && (!user || !allowedRoles.includes(user.role))) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
