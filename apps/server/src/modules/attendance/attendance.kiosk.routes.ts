import { Router } from "express";
import { checkInInputSchema, checkOutInputSchema } from "@forth-urban/validation";
import type { ApiEnvelope } from "../../middleware/error-handler.js";
import { ApiError } from "../../middleware/error-handler.js";
import { validateBody } from "../../middleware/validate.js";
import { recordAuditLog } from "../../lib/audit-log.service.js";
import { checkIn, checkOut, getOpenAttendanceLogs, searchStaff } from "./attendance.service.js";

/** Public kiosk operations. Deliberately mounted outside the authenticated admin router. */
export const attendanceKioskRouter: Router = Router();

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

attendanceKioskRouter.get("/open-logs", async (_req, res, next) => {
  try {
    const logs = await getOpenAttendanceLogs();
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
    const log = await checkIn(req.body);
    await recordAuditLog({
      actorId: null,
      actorType: "kiosk",
      action: "attendance.check_in",
      targetType: "AttendanceLog",
      targetId: log._id.toString(),
      metadata: { type: log.type, visitorName: log.visitorName, purpose: log.purpose },
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
      actorId: null,
      actorType: "kiosk",
      action: "attendance.check_out",
      targetType: "AttendanceLog",
      targetId: log._id.toString(),
      metadata: { durationMinutes: log.durationMinutes },
    });

    const body: ApiEnvelope = { success: true, message: "Checked out successfully", data: log, errors: null };
    res.json(body);
  } catch (error) {
    next(error);
  }
});
