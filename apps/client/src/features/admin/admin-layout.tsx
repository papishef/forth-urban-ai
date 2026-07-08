import { useState } from "react";
import type { ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LogOut,
  Menu,
  X,
  ClipboardCheck,
  Users as UsersIcon,
  Handshake,
  Building2,
  Mail,
  BarChart3,
  Settings as SettingsIcon,
  MapPin,
  Sparkles,
  ScrollText,
  type LucideIcon,
} from "lucide-react";
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
const NAV_ITEMS: Array<{ to: string; label: string; roles: UserRole[]; icon: LucideIcon }> = [
  { to: "/admin/inspections", label: "Inspections", roles: ["admin", "sales"], icon: ClipboardCheck },
  { to: "/admin/users", label: "Users", roles: ["admin", "sales"], icon: UsersIcon },
  { to: "/admin/crm", label: "CRM", roles: ["admin", "sales"], icon: Handshake },
  { to: "/admin/properties", label: "Properties", roles: ["admin"], icon: Building2 },
  { to: "/admin/email-campaigns", label: "Email Campaigns", roles: ["admin"], icon: Mail },
  { to: "/admin/analytics", label: "Analytics", roles: ["admin"], icon: BarChart3 },
  { to: "/admin/settings", label: "Settings", roles: ["admin"], icon: SettingsIcon },
  { to: "/admin/areas", label: "Areas", roles: ["admin"], icon: MapPin },
  { to: "/admin/prompts", label: "Prompts", roles: ["admin"], icon: Sparkles },
  { to: "/admin/logs", label: "Logs", roles: ["admin"], icon: ScrollText },
];

/** Shared shell for every `/admin/*` page — Phase 7 (docs/IMPLEMENTATION_PLAN.md#phase-7--admin-dashboard). */
export function AdminLayout({ title, children }: { title: string; children: ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [navOpen, setNavOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const dashboardLabel = user?.role === "sales" ? "Sales Dashboard" : "Admin Dashboard";
  const visibleNavItems = NAV_ITEMS.filter((item) => !user || item.roles.includes(user.role));

  return (
    <div className="min-h-screen bg-[#FFECE4]">
      {/* Mobile top bar: hamburger toggle, collapsed by default. */}
      <div className="fixed inset-x-0 top-0 z-30 flex h-14 items-center justify-between border-b border-[#5C4033]/10 bg-[#FFECE4]/95 px-4 backdrop-blur md:hidden">
        <Link to="/admin/inspections" className="flex items-center gap-2">
          <Logo className="h-6" />
        </Link>
        <button
          type="button"
          onClick={() => setNavOpen((open) => !open)}
          aria-label={navOpen ? "Close menu" : "Open menu"}
          aria-expanded={navOpen}
          className="rounded-lg border border-[#5C4033]/20 bg-white p-2 text-[#5C4033] shadow-sm transition hover:bg-[#5C4033]/5"
        >
          {navOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {navOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/30 md:hidden"
          onClick={() => setNavOpen(false)}
          aria-hidden="true"
        />
      )}

      <div className="mx-auto flex max-w-6xl items-start gap-6 px-4 py-8">
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-40 w-64 shrink-0 transform overflow-y-auto bg-[#FFECE4] px-4 py-6 shadow-xl transition-transform duration-200 ease-out",
            navOpen ? "translate-x-0" : "-translate-x-full",
            "md:static md:z-auto md:w-52 md:translate-x-0 md:overflow-visible md:px-0 md:py-0 md:shadow-none",
          )}
        >
          <Link to="/admin/inspections" className="mb-4 hidden items-center gap-2 md:flex">
            <Logo className="h-7" />
          </Link>
          <span className="mb-6 inline-flex items-center gap-1.5 rounded-full border border-[#5C4033]/20 bg-gradient-to-br from-white to-[#FFECE4]/60 px-3.5 py-1.5 font-heading text-xs font-semibold uppercase tracking-wider text-[#5C4033] shadow-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-[#5C4033]" />
            {dashboardLabel}
          </span>
          <nav className="flex flex-col gap-1">
            {visibleNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setNavOpen(false)}
                  className={cn(
                    "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-[#181818]/70 transition hover:bg-white/60",
                    location.pathname === item.to && "bg-white font-medium text-[#5C4033] shadow-sm",
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <Button
            variant="ghost"
            onClick={handleLogout}
            className="group mt-4 w-full justify-start gap-2 border border-transparent text-sm text-[#181818]/70 transition-all hover:border-red-200 hover:bg-red-50 hover:text-red-600"
          >
            <LogOut className="h-4 w-4 transition-transform group-hover:-translate-x-0.5 group-hover:text-red-600" />
            Sign out
          </Button>
        </aside>
        <main className="min-w-0 flex-1 pt-14 md:pt-0">
          <h1 className="mb-6 font-heading text-2xl font-semibold text-[#181818]">{title}</h1>
          {children}
        </main>
      </div>
    </div>
  );
}
