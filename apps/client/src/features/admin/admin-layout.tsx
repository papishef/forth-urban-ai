import type { ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";
import type { UserRole } from "@forth-urban/shared-types";
import { Button, cn, Logo } from "@forth-urban/ui";
import { useAuth } from "../../lib/auth-context";

// `roles` lists who can see/reach each tab. Sales reps only get the tabs
// tied to their day-to-day job — inspections (the conversion event they
// manage, incl. `assignedSalesRep`) and CRM (lead follow-up, incl.
// `salesRepId`) — plus read-only Users (to check a lead's readiness/persona
// before a call). Everything else is admin-only governance/config and
// stays invisible to sales (see modules/admin/index.ts for the matching
// server-side gate).
const NAV_ITEMS: Array<{ to: string; label: string; roles: UserRole[] }> = [
  { to: "/admin/inspections", label: "Inspections", roles: ["admin", "sales"] },
  { to: "/admin/users", label: "Users", roles: ["admin", "sales"] },
  { to: "/admin/crm", label: "CRM", roles: ["admin", "sales"] },
  { to: "/admin/properties", label: "Properties", roles: ["admin"] },
  { to: "/admin/email-campaigns", label: "Email Campaigns", roles: ["admin"] },
  { to: "/admin/analytics", label: "Analytics", roles: ["admin"] },
  { to: "/admin/settings", label: "Settings", roles: ["admin"] },
  { to: "/admin/areas", label: "Areas", roles: ["admin"] },
  { to: "/admin/prompts", label: "Prompts", roles: ["admin"] },
  { to: "/admin/logs", label: "Logs", roles: ["admin"] },
];

/** Shared shell for every `/admin/*` page — Phase 7 (docs/IMPLEMENTATION_PLAN.md#phase-7--admin-dashboard). */
export function AdminLayout({ title, children }: { title: string; children: ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const dashboardLabel = user?.role === "sales" ? "Sales Dashboard" : "Admin Dashboard";
  const visibleNavItems = NAV_ITEMS.filter((item) => !user || item.roles.includes(user.role));

  return (
    <div className="min-h-screen bg-[#FFECE4]">
      <div className="mx-auto flex max-w-6xl gap-6 px-4 py-8">
        <aside className="w-52 shrink-0 flex flex-col justify-between min-h-[80vh]">
          <div>
            <Link to="/admin/inspections" className="mb-4 flex items-center gap-2">
              <Logo className="h-7" />
            </Link>
            <span className="mb-6 inline-flex items-center gap-1.5 rounded-full border border-[#5C4033]/20 bg-gradient-to-br from-white to-[#FFECE4]/60 px-3.5 py-1.5 font-heading text-xs font-semibold uppercase tracking-wider text-[#5C4033] shadow-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-[#5C4033]" />
              {dashboardLabel}
            </span>
            <nav className="flex flex-col gap-1">
              {visibleNavItems.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "rounded-lg px-3 py-2 text-sm text-[#181818]/70 transition hover:bg-white/60",
                    location.pathname === item.to && "bg-white font-medium text-[#5C4033] shadow-sm",
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
          <Button
            variant="ghost"
            onClick={handleLogout}
            className="group mt-8 justify-start gap-2 border border-transparent text-sm text-[#181818]/70 transition-all hover:border-red-200 hover:bg-red-50 hover:text-red-600"
          >
            <LogOut className="h-4 w-4 transition-transform group-hover:-translate-x-0.5 group-hover:text-red-600" />
            Sign out
          </Button>
        </aside>
        <main className="min-w-0 flex-1">
          <h1 className="mb-6 font-heading text-2xl font-semibold text-[#181818]">{title}</h1>
          {children}
        </main>
      </div>
    </div>
  );
}
