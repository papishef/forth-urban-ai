import type { Request } from "express";

export interface AttendanceDeviceContext {
  source: "kiosk" | "admin";
  deviceId: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  actorEmail?: string | null;
}

export function getAttendanceDeviceContext(
  req: Request,
  source: AttendanceDeviceContext["source"],
  actorEmail?: string | null,
): AttendanceDeviceContext {
  const deviceId = req.get("x-kiosk-device-id")?.trim().slice(0, 128) || null;
  const userAgent = req.get("user-agent")?.slice(0, 500) || null;

  return {
    source,
    deviceId,
    ipAddress: req.ip ?? null,
    userAgent,
    actorEmail: actorEmail ?? null,
  };
}