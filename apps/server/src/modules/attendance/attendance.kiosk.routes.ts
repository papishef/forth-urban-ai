import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import { checkInInputSchema, checkOutInputSchema, kioskLoginSchema } from "@forth-urban/validation";
import type { ApiEnvelope } from "../../middleware/error-handler.js";
import { ApiError } from "../../middleware/error-handler.js";
import { validateBody } from "../../middleware/validate.js";
import { recordAuditLog } from "../../lib/audit-log.service.js";
import { requireKioskAuth } from "../auth/auth.middleware.js";
import { getAttendanceDeviceContext } from "./attendance-device.js";
import { checkIn, checkOut, getOpenAttendanceLogs, searchStaff } from "./attendance.service.js";
import { loginKiosk } from "./kiosk-auth.service.js";

/** Kiosk authentication and tablet attendance operations. */
export const attendanceKioskRouter: Router = Router();

const kioskLoginRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
});

attendanceKioskRouter.post("/login", kioskLoginRateLimit, validateBody(kioskLoginSchema), async (req, res, next) => {
  try {
    const device = getAttendanceDeviceContext(req, "kiosk");
    const data = await loginKiosk(req.body, {
      ip: device.ipAddress,
      userAgent: device.userAgent,
      deviceId: device.deviceId,
    });
    const body: ApiEnvelope = { success: true, message: "Kiosk unlocked", data, errors: null };
    res.json(body);
  } catch (error) {
    next(error);
  }
});

attendanceKioskRouter.use(requireKioskAuth);

attendanceKioskRouter.get("/staff-search", async (req, res, next) => {
  try {
    const query = typeof req.query.q === "string" ? req.query.q.trim() : "";
    if (!query) throw new ApiError(400, "Search query required");

    const results = await searchStaff(query);
    const body: ApiEnvelope = { success: true, message: "OK", data: results, errors: null };
    res.json(body);
  } catch (error) {
    next(error);
  }
});

attendanceKioskRouter.get("/open-logs", async (req, res, next) => {
  try {
    const search = typeof req.query.q === "string" ? req.query.q.trim() : undefined;
    const logs = await getOpenAttendanceLogs(undefined, search);
    const data = logs.map((log) => ({
      _id: log._id,
      type: log.type,
      visitorName: log.visitorName,
      staffId: log.staffId,
      checkInTime: log.checkInTime,
    }));
    const body: ApiEnvelope = { success: true, message: "OK", data, errors: null };
    res.json(body);
  } catch (error) {
    next(error);
  }
});

attendanceKioskRouter.post("/check-in", validateBody(checkInInputSchema), async (req, res, next) => {
  try {
    const log = await checkIn(req.body, getAttendanceDeviceContext(req, "kiosk", req.auth?.email));
    await recordAuditLog({
      actorId: req.auth!.sub,
      actorType: "admin",
      action: "attendance.check_in",
      targetType: "AttendanceLog",
      targetId: log._id.toString(),
      metadata: { type: log.type, visitorName: log.visitorName, purpose: log.purpose, deviceId: log.deviceId },
    });

    const body: ApiEnvelope = { success: true, message: "Checked in successfully", data: log, errors: null };
    res.status(201).json(body);
  } catch (error) {
    next(error);
  }
});

attendanceKioskRouter.patch("/:logId/check-out", validateBody(checkOutInputSchema), async (req, res, next) => {
  try {
    const logId = typeof req.params.logId === "string" ? req.params.logId : "";
    if (!logId) throw new ApiError(400, "Attendance log ID required");
    const log = await checkOut(logId, req.body.notes);
    await recordAuditLog({
      actorId: req.auth!.sub,
      actorType: "admin",
      action: "attendance.check_out",
      targetType: "AttendanceLog",
      targetId: log._id.toString(),
      metadata: { durationMinutes: log.durationMinutes, deviceId: log.deviceId },
    });

    const body: ApiEnvelope = { success: true, message: "Checked out successfully", data: log, errors: null };
    res.json(body);
  } catch (error) {
    next(error);
  }
});
