import { describe, it, expect } from "vitest";
import type { Types } from "mongoose";
import {
  calculateDwellStats,
  detectPeakHours,
  calculateNoShowRate,
  detectAnomalies,
  generateAnalyticsSnapshot,
} from "./attendance-analytics.js";
import type { AttendanceLogDocument } from "./attendance-log.model.js";

describe("Attendance Analytics", () => {
  // Mock log data for testing
  const createMockLog = (overrides?: Partial<AttendanceLogDocument>): AttendanceLogDocument => ({
    _id: { toString: () => "log-id" } as unknown as Types.ObjectId,
    type: "visitor",
    visitorName: "Test Visitor",
    checkInTime: new Date("2024-01-15T09:00:00Z"),
    checkOutTime: new Date("2024-01-15T10:00:00Z"),
    durationMinutes: 60,
    purpose: "inspect property",
    isNoShow: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    version: 0,
    ...overrides,
  } as unknown as AttendanceLogDocument);

  describe("calculateDwellStats", () => {
    it("should calculate correct dwell time statistics", () => {
      const logs = [
        createMockLog({ durationMinutes: 30 }),
        createMockLog({ durationMinutes: 60 }),
        createMockLog({ durationMinutes: 90 }),
      ];

      const stats = calculateDwellStats(logs);

      expect(stats.avgDwellMinutes).toBe(60);
      expect(stats.minDwellMinutes).toBe(30);
      expect(stats.maxDwellMinutes).toBe(90);
      expect(stats.count).toBe(3);
    });

    it("should handle logs with null durationMinutes", () => {
      const logs = [
        createMockLog({ durationMinutes: 60 }),
        createMockLog({ durationMinutes: null }),
      ];

      const stats = calculateDwellStats(logs);

      expect(stats.count).toBe(1);
      expect(stats.avgDwellMinutes).toBe(60);
    });

    it("should return zeros for empty array", () => {
      const stats = calculateDwellStats([]);

      expect(stats.count).toBe(0);
      expect(stats.avgDwellMinutes).toBe(0);
      expect(stats.maxDwellMinutes).toBe(0);
    });
  });

  describe("detectPeakHours", () => {
    it("should identify the busiest hour", () => {
      const logs = [
        createMockLog({ checkInTime: new Date("2024-01-15T09:00:00Z") }),
        createMockLog({ checkInTime: new Date("2024-01-15T09:15:00Z") }),
        createMockLog({ checkInTime: new Date("2024-01-15T09:30:00Z") }),
        createMockLog({ checkInTime: new Date("2024-01-15T10:00:00Z") }),
      ];

      const peakHours = detectPeakHours(logs);

      expect(peakHours[0]!.hour).toBe(9);
      expect(peakHours[0]!.checkInCount).toBe(3);
    });

    it("should return top 3 peak hours", () => {
      const logs = Array.from({ length: 12 }, (_, i) =>
        createMockLog({
          checkInTime: new Date(`2024-01-15T0${Math.floor(i / 4) + 8}:00:00Z`),
        })
      );

      const peakHours = detectPeakHours(logs);

      expect(peakHours.length).toBeLessThanOrEqual(3);
    });
  });

  describe("calculateNoShowRate", () => {
    it("should calculate no-show percentage for inspections", () => {
      const logs = [
        createMockLog({
          linkedInspectionId: { toString: () => "insp-1" } as unknown as Types.ObjectId,
          isNoShow: true,
        }),
        createMockLog({
          linkedInspectionId: { toString: () => "insp-2" } as unknown as Types.ObjectId,
          isNoShow: false,
        }),
        createMockLog({
          linkedInspectionId: { toString: () => "insp-3" } as unknown as Types.ObjectId,
          isNoShow: false,
        }),
      ];

      const rate = calculateNoShowRate(logs);

      expect(rate).toBeCloseTo(33.3, 1);
    });

    it("should return 0 for no inspection logs", () => {
      const logs = [createMockLog({ linkedInspectionId: null })];

      const rate = calculateNoShowRate(logs);

      expect(rate).toBe(0);
    });
  });

  describe("detectAnomalies", () => {
    it("should flag frequent visits (3+ same day)", () => {
      const today = new Date();
      const logs = [
        createMockLog({ visitorName: "John", checkInTime: new Date(today.getTime() + 1 * 60000) }),
        createMockLog({ visitorName: "John", checkInTime: new Date(today.getTime() + 2 * 60000) }),
        createMockLog({ visitorName: "John", checkInTime: new Date(today.getTime() + 3 * 60000) }),
      ];

      const anomalies = detectAnomalies(logs);

      expect(anomalies.some((a) => a.type === "frequent_visits")).toBe(true);
    });

    it("should flag long dwell times (>480 min)", () => {
      const logs = [createMockLog({ durationMinutes: 600 })];

      const anomalies = detectAnomalies(logs);

      expect(anomalies.some((a) => a.type === "long_dwell")).toBe(true);
    });

    it("should flag off-hours check-ins", () => {
      const logs = [createMockLog({ checkInTime: new Date("2024-01-15T06:00:00Z") })];

      const anomalies = detectAnomalies(logs);

      expect(anomalies.some((a) => a.type === "off_hours")).toBe(true);
    });

    it("should flag no-shows", () => {
      const logs = [
        createMockLog({
          linkedInspectionId: { toString: () => "insp-1" } as unknown as Types.ObjectId,
          isNoShow: true,
        }),
      ];

      const anomalies = detectAnomalies(logs);

      expect(anomalies.some((a) => a.type === "no_show")).toBe(true);
    });
  });

  describe("generateAnalyticsSnapshot", () => {
    it("should aggregate analytics correctly", () => {
      const logs = [
        createMockLog({
          type: "staff",
          staffId: { toString: () => "staff-1" } as unknown as Types.ObjectId,
          durationMinutes: 60,
          checkInTime: new Date("2024-01-15T09:00:00Z"),
        }),
        createMockLog({
          type: "visitor",
          visitorName: "Visitor1",
          durationMinutes: 30,
          checkInTime: new Date("2024-01-15T10:00:00Z"),
        }),
      ];

      const snapshot = generateAnalyticsSnapshot(logs);

      expect(snapshot.totalCheckIns).toBe(2);
      expect(snapshot.uniqueStaffCount).toBe(1);
      expect(snapshot.uniqueVisitorCount).toBe(1);
      expect(snapshot.avgDwellMinutes).toBe(45);
    });
  });
});
