import type { AttendanceLogDocument } from "./attendance-log.model.js";

/**
 * Pure analytics functions for attendance data.
 * No side effects, no LLM calls (AGENTS.md rule #2).
 */

export interface DwellStats {
  avgDwellMinutes: number;
  medianDwellMinutes: number;
  maxDwellMinutes: number;
  minDwellMinutes: number;
  count: number;
}

export interface PeakHour {
  hour: number;
  checkInCount: number;
}

export interface DailyTrend {
  date: string; // YYYY-MM-DD
  checkInCount: number;
  uniqueVisitors: number;
  avgDwellMinutes: number;
  noShowCount: number;
}

export interface AnomalyAlert {
  id: string;
  type: "frequent_visits" | "long_dwell" | "short_dwell" | "off_hours" | "no_show";
  severity: "info" | "warning" | "critical";
  message: string;
  visitorName: string;
  timestamp: Date;
  attendanceLogId: string;
}

export interface AnalyticsSnapshot {
  totalCheckIns: number;
  uniqueStaffCount: number;
  uniqueVisitorCount: number;
  avgDwellMinutes: number;
  peakHour: PeakHour | null;
  noShowRate: number; // percentage
  dailyTrend: DailyTrend[];
}

/**
 * Calculate dwell time statistics for a set of logs
 */
export function calculateDwellStats(logs: AttendanceLogDocument[]): DwellStats {
  const dwellTimes = logs
    .filter((log) => log.durationMinutes !== null)
    .map((log) => log.durationMinutes as number)
    .sort((a, b) => a - b);

  if (dwellTimes.length === 0) {
    return {
      avgDwellMinutes: 0,
      medianDwellMinutes: 0,
      maxDwellMinutes: 0,
      minDwellMinutes: 0,
      count: 0,
    };
  }

  const avg = dwellTimes.reduce((sum, t) => sum + t, 0) / dwellTimes.length;
  const median = dwellTimes[Math.floor(dwellTimes.length / 2)] ?? 0;
  const max = Math.max(...dwellTimes);
  const min = Math.min(...dwellTimes);

  return {
    avgDwellMinutes: Math.round(avg * 10) / 10,
    medianDwellMinutes: median,
    maxDwellMinutes: max,
    minDwellMinutes: min,
    count: dwellTimes.length,
  };
}

/**
 * Detect peak hours (hour with highest check-in count)
 */
export function detectPeakHours(logs: AttendanceLogDocument[]): PeakHour[] {
  const hourCounts: Record<number, number> = {};

  logs.forEach((log) => {
    const hour = log.checkInTime.getUTCHours();
    hourCounts[hour] = (hourCounts[hour] || 0) + 1;
  });

  return Object.entries(hourCounts)
    .map(([hour, count]) => ({ hour: Number(hour), checkInCount: count }))
    .sort((a, b) => b.checkInCount - a.checkInCount)
    .slice(0, 3); // Top 3 peak hours
}

/**
 * Calculate no-show rate for inspection bookings
 */
export function calculateNoShowRate(logs: AttendanceLogDocument[]): number {
  const logsWithInspections = logs.filter((log) => log.linkedInspectionId);
  if (logsWithInspections.length === 0) return 0;

  const noShowCount = logsWithInspections.filter((log) => log.isNoShow).length;
  return Math.round((noShowCount / logsWithInspections.length) * 100 * 10) / 10; // one decimal
}

/**
 * Detect anomalies in attendance patterns
 */
export function detectAnomalies(logs: AttendanceLogDocument[]): AnomalyAlert[] {
  const alerts: AnomalyAlert[] = [];
  const visitorMap = new Map<string, AttendanceLogDocument[]>();

  const getPersonName = (log: { type: "staff" | "visitor"; visitorName?: string | null; staffId?: unknown }): string => {
    if (log.type === "visitor") return log.visitorName || "Visitor";
    const staff = log.staffId as unknown as { firstName?: string; lastName?: string } | null;
    return staff?.firstName ? `${staff.firstName} ${staff.lastName || ""}`.trim() : String(log.staffId || "Staff");
  };

  // Group logs by visitor/staff
  logs.forEach((log) => {
    const key = log.type === "staff" ? log.staffId?.toString() || "unknown" : log.visitorName || "unknown";
    if (!visitorMap.has(key)) visitorMap.set(key, []);
    visitorMap.get(key)!.push(log);
  });

  // Check for anomalies
  visitorMap.forEach((visitorLogs, visitorKey) => {
    const firstLog = visitorLogs[0];
    if (!firstLog) return;
    const visitorName = getPersonName(firstLog);

    // Anomaly 1: 3+ visits on the same day
    const logsToday = visitorLogs.filter((log) => {
      const today = new Date();
      const logDate = new Date(log.checkInTime);
      return (
        logDate.getFullYear() === today.getFullYear() &&
        logDate.getMonth() === today.getMonth() &&
        logDate.getDate() === today.getDate()
      );
    });

    if (logsToday.length >= 3) {
      alerts.push({
        id: `anomaly-frequent-${visitorKey}-${Date.now()}`,
        type: "frequent_visits",
        severity: "warning",
        message: `${visitorName} has checked in ${logsToday.length} times today`,
        visitorName: String(visitorName),
        timestamp: new Date(),
        attendanceLogId: logsToday[0]!._id.toString(),
      });
    }

    // Anomaly 2: Dwell time > 480 minutes (8 hours)
    visitorLogs.forEach((log) => {
      if (log.durationMinutes && log.durationMinutes > 480) {
        alerts.push({
          id: `anomaly-long-dwell-${log._id}`,
          type: "long_dwell",
          severity: "info",
          message: `${visitorName} spent ${log.durationMinutes} minutes on site (>8h)`,
          visitorName: String(visitorName),
          timestamp: log.checkInTime,
          attendanceLogId: log._id.toString(),
        });
      }

      // Anomaly 3: Dwell time < 5 minutes
      if (log.durationMinutes && log.durationMinutes < 5 && log.checkOutTime) {
        alerts.push({
          id: `anomaly-short-dwell-${log._id}`,
          type: "short_dwell",
          severity: "info",
          message: `${visitorName} spent only ${log.durationMinutes} minutes on site (<5min)`,
          visitorName: String(visitorName),
          timestamp: log.checkInTime,
          attendanceLogId: log._id.toString(),
        });
      }

      // Anomaly 4: Check-in outside business hours (before 7am or after 7pm)
      const hour = log.checkInTime.getUTCHours();
      if (hour < 7 || hour >= 19) {
        alerts.push({
          id: `anomaly-off-hours-${log._id}`,
          type: "off_hours",
          severity: "info",
          message: `${visitorName} checked in at ${hour}:00 (outside business hours)`,
          visitorName: String(visitorName),
          timestamp: log.checkInTime,
          attendanceLogId: log._id.toString(),
        });
      }

      // Anomaly 5: No-show flagged
      if (log.isNoShow && log.linkedInspectionId) {
        alerts.push({
          id: `anomaly-no-show-${log._id}`,
          type: "no_show",
          severity: "critical",
          message: `${visitorName} was marked as no-show for inspection`,
          visitorName: String(visitorName),
          timestamp: log.checkInTime,
          attendanceLogId: log._id.toString(),
        });
      }
    });
  });

  return alerts;
}

/**
 * Generate 30-day daily trend
 */
export function generateDailyTrend(logs: AttendanceLogDocument[], daysBack: number = 30): DailyTrend[] {
  const trend: Map<string, { totalCheckIns: number; checkIns: Set<string>; avgDwell: number[]; noShows: number }> = new Map();

  // Group by date
  logs.forEach((log) => {
    const date = log.checkInTime.toISOString().split("T")[0]!; // YYYY-MM-DD
    if (!trend.has(date)) {
      trend.set(date, { totalCheckIns: 0, checkIns: new Set(), avgDwell: [], noShows: 0 });
    }

    const dayData = trend.get(date)!;
    const visitorKey = log.type === "staff" ? log.staffId?.toString() : log.visitorName;
    dayData.totalCheckIns += 1;
    dayData.checkIns.add(visitorKey || "unknown");

    if (log.durationMinutes) dayData.avgDwell.push(log.durationMinutes);
    if (log.isNoShow) dayData.noShows += 1;
  });

  // Convert to array and sort by date
  return Array.from(trend.entries())
    .map(([date, data]) => ({
      date,
      checkInCount: data.totalCheckIns,
      uniqueVisitors: data.checkIns.size,
      avgDwellMinutes:
        data.avgDwell.length > 0 ? Math.round((data.avgDwell.reduce((a, b) => a + b, 0) / data.avgDwell.length) * 10) / 10 : 0,
      noShowCount: data.noShows,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Aggregate analytics snapshot from logs
 */
export function generateAnalyticsSnapshot(logs: AttendanceLogDocument[]): AnalyticsSnapshot {
  const staffLogs = logs.filter((log) => log.type === "staff");
  const visitorLogs = logs.filter((log) => log.type === "visitor");

  const uniqueStaff = new Set(staffLogs.map((log) => log.staffId?.toString() || ""));
  const uniqueVisitors = new Set(visitorLogs.map((log) => log.visitorName || ""));

  const dwellStats = calculateDwellStats(logs);
  const peakHours = detectPeakHours(logs);
  const noShowRate = calculateNoShowRate(logs);
  const dailyTrend = generateDailyTrend(logs);

  return {
    totalCheckIns: logs.length,
    uniqueStaffCount: uniqueStaff.size,
    uniqueVisitorCount: uniqueVisitors.size,
    avgDwellMinutes: dwellStats.avgDwellMinutes,
    peakHour: peakHours.length > 0 ? peakHours[0]! : null,
    noShowRate,
    dailyTrend,
  };
}
