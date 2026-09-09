import {
  ADMIN_MENU_KEYS,
  type AdminMenuKey,
  type UserDTO,
} from "@forth-urban/shared-types";

export const ADMIN_MENU_PATHS: Record<AdminMenuKey, string> = {
  inspections: "/admin/inspections",
  crm: "/admin/crm",
  "contact-messages": "/admin/contact-messages",
  users: "/admin/users",
  properties: "/admin/properties",
  attendance: "/admin/attendance",
  blog: "/admin/blog",
  newsletter: "/admin/newsletter",
  "email-campaigns": "/admin/email-campaigns",
  analytics: "/admin/analytics",
  settings: "/admin/settings",
  areas: "/admin/areas",
  prompts: "/admin/prompts",
  logs: "/admin/logs",
  kiosk: "/kiosk",
};

export function hasAdminSurface(user: UserDTO | null): boolean {
  return Boolean(user && (user.role === "admin" || user.adminAccess));
}

export function canReadAdminMenu(user: UserDTO | null, menu: AdminMenuKey): boolean {
  if (!user) return false;
  if (user.role === "admin") return true;
  const permission = user.adminAccess?.permissions[menu];
  return Boolean(permission?.read || permission?.write);
}

export function canWriteAdminMenu(user: UserDTO | null, menu: AdminMenuKey): boolean {
  if (!user) return false;
  if (user.role === "admin") return true;
  return Boolean(user.adminAccess?.permissions[menu]?.write);
}

export function getAdminLandingPath(user: UserDTO | null): string {
  if (!user || !hasAdminSurface(user)) return "/dashboard";
  if (user.role === "admin") return ADMIN_MENU_PATHS.inspections;

  const firstReadableMenu = ADMIN_MENU_KEYS.find((menu) => canReadAdminMenu(user, menu));
  return firstReadableMenu ? ADMIN_MENU_PATHS[firstReadableMenu] : "/profile";
}