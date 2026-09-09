import { Router } from "express";
import { checkInInputSchema, checkOutInputSchema, staffInputSchema, staffUpdateSchema } from "@forth-urban/validation";
import type { PaginatedResultDTO } from "@forth-urban/shared-types";
import type { ApiEnvelope } from "../../middleware/error-handler.js";
import { ApiError } from "../../middleware/error-handler.js";
import { validateBody } from "../../middleware/validate.js";
import { recordAuditLog } from "../../lib/audit-log.service.js";
import { requireAdminPermission } from "../auth/permissions.js";
import {
  createStaff,
  listStaff,
  getStaff,
  getStaffAttendance,
  updateStaff,
  deleteStaff,
  checkIn,
  checkOut,
  getAttendanceLog,
  listAttendanceLogs,
  flagNoShows,
  searchStaff,
} from "./attendance.service.js";
import {
  generateAnalyticsSnapshot,
  detectAnomalies,
} from "./attendance-analytics.js";
import { AttendanceLog } from "./attendance-log.model.js";
import { getAttendanceDeviceContext } from "./attendance-device.js";

/**
 * Attendance Register Admin Routes
 * - GET/POST/PATCH/DELETE /api/admin/attendance/staff — staff CRUD
 * - POST /api/admin/attendance/check-in — record check-in (public or kiosk)
 * - PATCH /api/admin/attendance/:logId/check-out — record check-out
 * - GET /api/admin/attendance/logs — view logs (paginated, filterable)
 * - GET /api/admin/attendance/analytics/summary — overview stats
 * - GET /api/admin/attendance/analytics/anomalies — flagged patterns
 * - GET /api/admin/attendance/report — CSV export
 */
export const attendanceAdminRouter: Router = Router();

/**
 * Pagination helper
 */
function parsePagination(query: Record<string, unknown>): { page: number; limit: number } {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
  return { page, limit };
}

/**
 * =====================
 * STAFF MANAGEMENT
 * =====================
 */

/**
 * GET /api/admin/attendance/staff — List staff members
 */
attendanceAdminRouter.get("/staff", requireAdminPermission("attendance", "read"), async (req, res, next) => {
  try {
    const { page, limit } = parsePagination(req.query as Record<string, unknown>);
    const filters = {
      department: typeof req.query.department === "string" ? req.query.department : undefined,
      status: typeof req.query.status === "string" ? req.query.status : undefined,
    };

    const { items, total } = await listStaff(filters, page, limit);

    const data: PaginatedResultDTO<typeof items[number]> = { items, total, page, limit };
    const body: ApiEnvelope = { success: true, message: "OK", data, errors: null };
    res.json(body);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/admin/attendance/staff — Create new staff member
 */
attendanceAdminRouter.post("/staff", requireAdminPermission("attendance", "write"), validateBody(staffInputSchema), async (req, res, next) => {
  try {
    const staff = await createStaff(req.body);

    await recordAuditLog({
      actorId: req.auth!.sub,
      actorType: "admin",
      action: "admin.attendance.staff.created",
      targetType: "Staff",
      targetId: staff._id.toString(),
      metadata: { email: staff.email, department: staff.department },
    });

    const body: ApiEnvelope = { success: true, message: "Staff member created", data: staff, errors: null };
    res.status(201).json(body);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/admin/attendance/staff/:id — Get single staff member
 */
attendanceAdminRouter.get("/staff/:id", requireAdminPermission("attendance", "read"), async (req, res, next) => {
  try {
    const id = typeof req.params.id === "string" ? req.params.id : "";
    const staff = await getStaff(id);
    const body: ApiEnvelope = { success: true, message: "OK", data: staff, errors: null };
    res.json(body);
  } catch (err) {
    next(err);
  }
});

attendanceAdminRouter.get("/staff/:id/attendance", requireAdminPermission("attendance", "read"), async (req, res, next) => {
  try {
    const staffId = typeof req.params.id === "string" ? req.params.id : "";
    if (!staffId) throw new ApiError(400, "Staff ID required");
    const items = await getStaffAttendance(staffId);
    const body: ApiEnvelope = { success: true, message: "OK", data: items, errors: null };
    res.json(body);
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/admin/attendance/staff/:id — Update staff member
 */
attendanceAdminRouter.patch(
  "/staff/:id",
  requireAdminPermission("attendance", "write"),
  validateBody(staffUpdateSchema),
  async (req, res, next) => {
    try {
      const id = typeof req.params.id === "string" ? req.params.id : "";
      const staff = await updateStaff(id, req.body);

      await recordAuditLog({
        actorId: req.auth!.sub,
        actorType: "admin",
        action: "admin.attendance.staff.updated",
        targetType: "Staff",
        targetId: staff._id.toString(),
        metadata: req.body,
      });

      const body: ApiEnvelope = { success: true, message: "Staff member updated", data: staff, errors: null };
      res.json(body);
    } catch (err) {
      next(err);
    }
  }
);

/**
 * DELETE /api/admin/attendance/staff/:id — Soft delete staff member
 */
attendanceAdminRouter.delete("/staff/:id", requireAdminPermission("attendance", "write"), async (req, res, next) => {
  try {
    const id = typeof req.params.id === "string" ? req.params.id : "";
    await deleteStaff(id);

    await recordAuditLog({
      actorId: req.auth!.sub,
      actorType: "admin",
      action: "admin.attendance.staff.deleted",
      targetType: "Staff",
      targetId: id,
    });

    const body: ApiEnvelope = { success: true, message: "Staff member deleted", data: null, errors: null };
    res.json(body);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/admin/attendance/staff/search?q=name — Search staff by name/email/badge
 */
attendanceAdminRouter.get("/staff-search", async (req, res, next) => {
  try {
    const query = typeof req.query.q === "string" ? req.query.q : "";
    if (!query || query.length < 1) throw new ApiError(400, "Search query required");

    const results = await searchStaff(query);
    const body: ApiEnvelope = { success: true, message: "OK", data: results, errors: null };
    res.json(body);
  } catch (err) {
    next(err);
  }
});

/**
 * =====================
 * CHECK-IN / CHECK-OUT
 * =====================
 */

/**
 * POST /api/admin/attendance/check-in — Record a check-in (kiosk or admin)
 */
attendanceAdminRouter.post("/check-in", validateBody(checkInInputSchema), async (req, res, next) => {
  try {
    const log = await checkIn(req.body, getAttendanceDeviceContext(req, "admin", req.auth?.email));

    // Audit log (use "kiosk" as actor if no auth, or use authenticated admin)
    await recordAuditLog({
      actorId: req.auth?.sub || "kiosk",
      actorType: req.auth ? "admin" : "kiosk",
      action: "attendance.check_in",
      targetType: "AttendanceLog",
      targetId: log._id.toString(),
      metadata: {
        type: log.type,
        visitorName: log.visitorName,
        purpose: log.purpose,
        deviceId: log.deviceId,
      },
    });

    const body: ApiEnvelope = { success: true, message: "Checked in successfully", data: log, errors: null };
    res.status(201).json(body);
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/admin/attendance/:logId/check-out — Record a check-out
 */
attendanceAdminRouter.patch(
  "/:logId/check-out",
  validateBody(checkOutInputSchema),
  async (req, res, next) => {
    try {
      const logId = typeof req.params.logId === "string" ? req.params.logId : "";
      const log = await checkOut(logId, req.body.notes);

      await recordAuditLog({
        actorId: req.auth?.sub || "kiosk",
        actorType: req.auth ? "admin" : "kiosk",
        action: "attendance.check_out",
        targetType: "AttendanceLog",
        targetId: log._id.toString(),
        metadata: {
          durationMinutes: log.durationMinutes,
          deviceId: log.deviceId,
        },
      });

      const body: ApiEnvelope = { success: true, message: "Checked out successfully", data: log, errors: null };
      res.json(body);
    } catch (err) {
      next(err);
    }
  }
);

/**
 * =====================
 * LOGS / VIEWING
 * =====================
 */

/**
 * GET /api/admin/attendance/logs — View attendance logs (paginated, filterable)
 */
attendanceAdminRouter.get("/logs", requireAdminPermission("attendance", "read"), async (req, res, next) => {
  try {
    // Flag no-shows first (6h+ without checkout)
    await flagNoShows();

    const { page, limit } = parsePagination(req.query as Record<string, unknown>);

    const filters: Parameters<typeof listAttendanceLogs>[0] = {};
    if (req.query.startDate) filters.startDate = new Date(req.query.startDate as string);
    if (req.query.endDate) filters.endDate = new Date(req.query.endDate as string);
    if (req.query.type) filters.type = req.query.type as "staff" | "visitor";
    if (req.query.status) filters.status = req.query.status as "checked-out" | "no-show" | "pending";
    if (req.query.purpose) filters.purpose = req.query.purpose as string;
    if (req.query.assignedSalesRep) filters.assignedSalesRep = req.query.assignedSalesRep as string;

    const { items, total } = await listAttendanceLogs(filters, page, limit);

    const data: PaginatedResultDTO<typeof items[number]> = { items, total, page, limit };
    const body: ApiEnvelope = { success: true, message: "OK", data, errors: null };
    res.json(body);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/admin/attendance/:logId — Get single attendance log
 */
attendanceAdminRouter.get("/:logId", requireAdminPermission("attendance", "read"), async (req, res, next) => {
  try {
    const logId = typeof req.params.logId === "string" ? req.params.logId : "";
    const log = await getAttendanceLog(logId);
    const body: ApiEnvelope = { success: true, message: "OK", data: log, errors: null };
    res.json(body);
  } catch (err) {
    next(err);
  }
});

/**
 * =====================
 * ANALYTICS & INSIGHTS
 * =====================
 */

/**
 * GET /api/admin/attendance/analytics/summary — Overall attendance snapshot
 */
attendanceAdminRouter.get("/analytics/summary", requireAdminPermission("attendance", "read"), async (req, res, next) => {
  try {
    const days = Number(req.query.days) || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const logs = await AttendanceLog.find({
      checkInTime: { $gte: startDate },
    }).populate("staffId", "firstName lastName email department role");

    const snapshot = generateAnalyticsSnapshot(logs);
    const body: ApiEnvelope = { success: true, message: "OK", data: snapshot, errors: null };
    res.json(body);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/admin/attendance/analytics/anomalies — Flagged patterns
 */
attendanceAdminRouter.get("/analytics/anomalies", requireAdminPermission("attendance", "read"), async (req, res, next) => {
  try {
    const days = Number(req.query.days) || 7; // Last 7 days by default
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const logs = await AttendanceLog.find({
      checkInTime: { $gte: startDate },
    }).populate("staffId", "firstName lastName email department role");

    const anomalies = detectAnomalies(logs);
    const data = { anomalies, count: anomalies.length };
    const body: ApiEnvelope = { success: true, message: "OK", data, errors: null };
    res.json(body);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/admin/attendance/report — CSV export
 */
attendanceAdminRouter.get("/report", requireAdminPermission("attendance", "read"), async (req, res, next) => {
  try {
    const days = Number(req.query.days) || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const logs = await AttendanceLog.find({
      checkInTime: { $gte: startDate },
    })
      .populate("staffId", "firstName lastName department role")
      .populate("assignedSalesRep", "firstName lastName")
      .sort({ checkInTime: -1 });

    // Generate CSV
    const headers = ["Date", "Name", "Type", "Department", "Check-In", "Check-Out", "Duration (mins)", "Purpose", "Sales Rep", "Device ID", "Device IP", "Notes"];
    const rows = logs.map((log) => {
      const staff = log.staffId as unknown as { firstName?: string; lastName?: string; department?: string } | null;
      const salesRepRef = log.assignedSalesRep as unknown as { firstName?: string; lastName?: string } | null;
      const name = log.type === "staff" ? `${staff?.firstName} ${staff?.lastName}` : log.visitorName;
      const dept = log.type === "staff" ? staff?.department : "Visitor";
      const salesRep = salesRepRef?.firstName ? `${salesRepRef.firstName} ${salesRepRef.lastName}` : "N/A";

      return [
        log.checkInTime.toISOString().split("T")[0],
        name,
        log.type,
        dept,
        log.checkInTime.toISOString(),
        log.checkOutTime ? log.checkOutTime.toISOString() : "Not checked out",
        log.durationMinutes || "N/A",
        log.purpose,
        salesRep,
        log.deviceId || "N/A",
        log.deviceIp || "N/A",
        log.notes || "",
      ];
    });

    // Create CSV content. Cells hold free-text user input (notes, visitor
    // name, purpose), so quotes must be doubled per RFC 4180 and any
    // leading =/+/-/@ neutralized so spreadsheet apps don't treat it as a
    // formula (CSV/formula injection).
    const csvCell = (value: unknown) => {
      let cell = String(value ?? "");
      if (/^[=+\-@]/.test(cell)) cell = `'${cell}`;
      return `"${cell.replace(/"/g, '""')}"`;
    };
    const csv = [headers, ...rows].map((row) => row.map(csvCell).join(",")).join("\n");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="attendance-report-${Date.now()}.csv"`);
    res.send(csv);
  } catch (err) {
    next(err);
  }
});

export default attendanceAdminRouter;
