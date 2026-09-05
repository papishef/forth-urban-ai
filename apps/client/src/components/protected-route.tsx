import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import type { AdminMenuKey, UserRole } from "@forth-urban/shared-types";
import { BuildingLoader } from "@forth-urban/ui";
import { useAuth } from "../lib/auth-context";
import { canReadAdminMenu, canWriteAdminMenu, getAdminLandingPath, hasAdminSurface } from "../lib/admin-access";

export function ProtectedRoute({
  children,
  role,
  audience = "any",
  requiredMenu,
  requiredPermission = "read",
}: {
  children: ReactNode;
  role?: UserRole | UserRole[];
  audience?: "any" | "customer" | "admin";
  requiredMenu?: AdminMenuKey;
  requiredPermission?: "read" | "write";
}) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FFECE4]">
        <BuildingLoader size="lg" label="Loading…" />
      </div>
    );
  }

  if (!isAuthenticated) {
    const next = `${location.pathname}${location.search}${location.hash}`;
    return <Navigate to={`/login?next=${encodeURIComponent(next)}`} replace />;
  }

  const allowedRoles = role ? (Array.isArray(role) ? role : [role]) : null;
  if (allowedRoles && (!user || !allowedRoles.includes(user.role))) {
    return <Navigate to="/dashboard" replace />;
  }

  if (audience === "customer" && hasAdminSurface(user)) {
    return <Navigate to={getAdminLandingPath(user)} replace />;
  }

  if (audience === "admin" && !hasAdminSurface(user)) {
    return <Navigate to="/dashboard" replace />;
  }

  if (requiredMenu) {
    const hasAccess =
      requiredPermission === "write"
        ? canWriteAdminMenu(user, requiredMenu)
        : canReadAdminMenu(user, requiredMenu);
    if (!hasAccess) return <Navigate to={getAdminLandingPath(user)} replace />;
  }

  return <>{children}</>;
}
