import { describe, expect, it } from "vitest";
import { resolveEngineCta } from "./engine-cta";
import type { UserDTO } from "@forth-urban/shared-types";

const mockUser: UserDTO = {
  id: "user-123",
  firstName: "Amina",
  lastName: "Bello",
  email: "amina@example.com",
  authProvider: "local",
  emailVerified: true,
  whatsappNumber: null,
  currentCity: "Abuja",
  currentCountry: "Nigeria",
  isDiaspora: false,
  role: "user",
  status: "active",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const mockAdmin: UserDTO = {
  ...mockUser,
  id: "admin-123",
  role: "admin",
};

const mockSubAdmin: UserDTO = {
  ...mockUser,
  id: "sub-admin-123",
  adminAccess: {
    title: "Operations Coordinator",
    ownerId: "admin-123",
    permissions: { inspections: { read: true, write: true } },
    grantedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
};

describe("resolveEngineCta", () => {
  describe("when unauthenticated", () => {
    it("routes 'quiz' intent directly to the public readiness quiz", () => {
      const cta = resolveEngineCta(null, false, "quiz");
      expect(cta.to).toBe("/quiz/home-readiness");
      expect(cta.isEngineRoute).toBe(true);
    });

    it("starts unauthenticated visitors with the public readiness quiz", () => {
      const cta = resolveEngineCta(null, false, "start");
      expect(cta.to).toBe("/quiz/home-readiness");
      expect(cta.label).toBe("Take AI Readiness Quiz");
      expect(cta.isEngineRoute).toBe(true);
    });

    it("routes 'properties' intent to /register", () => {
      const cta = resolveEngineCta(null, false, "properties");
      expect(cta.to).toBe("/register");
      expect(cta.isEngineRoute).toBe(true);
    });

    it("routes 'book-inspection' intent to /register", () => {
      const cta = resolveEngineCta(null, false, "book-inspection");
      expect(cta.to).toBe("/register");
      expect(cta.isEngineRoute).toBe(true);
    });

    it("routes 'dashboard' intent to /login", () => {
      const cta = resolveEngineCta(null, false, "dashboard");
      expect(cta.to).toBe("/login");
      expect(cta.isEngineRoute).toBe(true);
    });
  });

  describe("when authenticated as regular user", () => {
    it("routes 'quiz' intent to /quiz/home-readiness", () => {
      const cta = resolveEngineCta(mockUser, true, "quiz");
      expect(cta.to).toBe("/quiz/home-readiness");
      expect(cta.isEngineRoute).toBe(true);
    });

    it("routes 'properties' intent to /properties/recommended", () => {
      const cta = resolveEngineCta(mockUser, true, "properties");
      expect(cta.to).toBe("/properties/recommended");
      expect(cta.isEngineRoute).toBe(true);
    });

    it("routes 'book-inspection' intent to /inspections/book", () => {
      const cta = resolveEngineCta(mockUser, true, "book-inspection");
      expect(cta.to).toBe("/inspections/book");
      expect(cta.isEngineRoute).toBe(true);
    });

    it("routes 'dashboard' and 'start' intent to /dashboard", () => {
      const cta = resolveEngineCta(mockUser, true, "start");
      expect(cta.to).toBe("/dashboard");
      expect(cta.label).toBe("Go to Dashboard");
      expect(cta.isEngineRoute).toBe(true);
    });
  });

  describe("when authenticated as staff", () => {
    it("routes admin to /admin/inspections for general CTAs", () => {
      const cta = resolveEngineCta(mockAdmin, true, "start");
      expect(cta.to).toBe("/admin/inspections");
      expect(cta.label).toBe("Open admin dashboard");
    });

    it("routes a sub-admin to their first readable menu", () => {
      const cta = resolveEngineCta(mockSubAdmin, true, "start");
      expect(cta.to).toBe("/admin/inspections");
    });

    it("routes admin to /admin/properties for property intent", () => {
      const cta = resolveEngineCta(mockAdmin, true, "properties");
      expect(cta.to).toBe("/admin/properties");
    });
  });
});
