import type { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@forth-urban/ui";

const NAV_ITEMS: Array<{ to: string; label: string }> = [
  { to: "/admin/users", label: "Users" },
  { to: "/admin/properties", label: "Properties" },
  { to: "/admin/inspections", label: "Inspections" },
  { to: "/admin/crm", label: "CRM" },
  { to: "/admin/email-campaigns", label: "Email Campaigns" },
  { to: "/admin/analytics", label: "Analytics" },
  { to: "/admin/settings", label: "Settings" },
  { to: "/admin/areas", label: "Areas" },
  { to: "/admin/prompts", label: "Prompts" },
  { to: "/admin/logs", label: "Logs" },
];

/** Shared shell for every `/admin/*` page — Phase 7 (docs/IMPLEMENTATION_PLAN.md#phase-7--admin-dashboard). */
export function AdminLayout({ title, children }: { title: string; children: ReactNode }) {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-[#FFECE4]">
      <div className="mx-auto flex max-w-6xl gap-6 px-4 py-8">
        <aside className="w-52 shrink-0">
          <p className="mb-4 font-heading text-lg font-semibold text-[#181818]">Admin</p>
          <nav className="flex flex-col gap-1">
            {NAV_ITEMS.map((item) => (
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
            <Link to="/dashboard" className="mt-4 rounded-lg px-3 py-2 text-sm text-[#181818]/50 hover:bg-white/60">
              ← Back to app
            </Link>
          </nav>
        </aside>
        <main className="min-w-0 flex-1">
          <h1 className="mb-6 font-heading text-2xl font-semibold text-[#181818]">{title}</h1>
          {children}
        </main>
      </div>
    </div>
  );
}
