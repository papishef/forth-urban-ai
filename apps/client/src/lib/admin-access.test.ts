import { describe, expect, it } from "vitest";
import type { UserDTO } from "@forth-urban/shared-types";
import { canReadAdminMenu, canWriteAdminMenu, getAdminLandingPath, hasAdminSurface } from "./admin-access";

const baseUser: UserDTO = {
  id: "user-1",
  firstName: "Ada",
  lastName: "Lovelace",
  email: "ada@example.com",
  authProvider: "local",
  emailVerified: true,
  whatsappNumber: null,
  currentCity: null,
  currentCountry: null,
  isDiaspora: false,
  role: "user",
  status: "active",
  createdAt: "2026-08-20T00:00:00.000Z",
  updatedAt: "2026-08-20T00:00:00.000Z",
};

describe("admin access resolver", () => {
  it("gives the owner every menu and the owner landing path", () => {
    const owner = { ...baseUser, role: "admin" as const };
    expect(hasAdminSurface(owner)).toBe(true);
    expect(canReadAdminMenu(owner, "properties")).toBe(true);
    expect(canWriteAdminMenu(owner, "settings")).toBe(true);
    expect(getAdminLandingPath(owner)).toBe("/admin/inspections");
  });

  it("lands a sub-admin on its first readable menu and separates read from write", () => {
    const subAdmin: UserDTO = {
      ...baseUser,
      adminAccess: {
        title: "Viewer",
        ownerId: "owner-1",
        permissions: {
          crm: { read: true, write: false },
          properties: { read: true, write: true },
        },
        grantedAt: "2026-08-20T00:00:00.000Z",
        updatedAt: "2026-08-20T00:00:00.000Z",
      },
    };

    expect(hasAdminSurface(subAdmin)).toBe(true);
    expect(canReadAdminMenu(subAdmin, "crm")).toBe(true);
    expect(canWriteAdminMenu(subAdmin, "crm")).toBe(false);
    expect(canWriteAdminMenu(subAdmin, "properties")).toBe(true);
    expect(getAdminLandingPath(subAdmin)).toBe("/admin/crm");
  });

  it("keeps an ordinary user on the customer dashboard", () => {
    expect(hasAdminSurface(baseUser)).toBe(false);
    expect(getAdminLandingPath(baseUser)).toBe("/dashboard");
  });
});