import { Staff, type StaffDocument } from "./staff.model.js";
import { AttendanceLog, type AttendanceLogDocument } from "./attendance-log.model.js";
import { User } from "../users/index.js";
import { InspectionBooking } from "../inspections/inspection-booking.model.js";
import { ApiError } from "../../middleware/error-handler.js";
import type { StaffInput, StaffUpdateInput, CheckInInput, CheckOutInput } from "@forth-urban/validation";
import type { AttendanceDeviceContext } from "./attendance-device.js";

/**
 * Staff CRUD operations
 */
export async function createStaff(input: StaffInput): Promise<StaffDocument> {
  const existing = await Staff.findOne({ email: input.email.toLowerCase() });
  if (existing) throw new ApiError(409, "A staff member with this email already exists");

  const staff = new Staff(input);
  await staff.save();
  return staff;
}

export async function listStaff(
  filters?: { department?: string; status?: string },
  page: number = 1,
  limit: number = 20
): Promise<{ items: StaffDocument[]; total: number; page: number; limit: number }> {
  const query: Record<string, unknown> = {};
  if (filters?.department) query.department = filters.department;
  if (filters?.status) query.status = filters.status;

  const [items, total] = await Promise.all([
    Staff.find(query)
      .sort({ lastName: 1, firstName: 1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Staff.countDocuments(query),
  ]);

  return { items, total, page, limit };
}

export async function getStaff(id: string): Promise<StaffDocument> {
  const staff = await Staff.findById(id);
  if (!staff) throw new ApiError(404, "Staff member not found");
  return staff;
}

export async function getStaffAttendance(id: string): Promise<AttendanceLogDocument[]> {
  return AttendanceLog.find({ staffId: id })
    .populate("staffId", "firstName lastName email department role")
    .sort({ checkInTime: -1 });
}

export async function updateStaff(id: string, input: StaffUpdateInput): Promise<StaffDocument> {
  const staff = await Staff.findById(id);
  if (!staff) throw new ApiError(404, "Staff member not found");

  // Check email uniqueness if updating email
  if (input.email && input.email.toLowerCase() !== staff.email) {
    const existing = await Staff.findOne({ email: input.email.toLowerCase() });
    if (existing) throw new ApiError(409, "A staff member with this email already exists");
  }

  Object.assign(staff, input);
  await staff.save();
  return staff;
}

export async function deleteStaff(id: string): Promise<void> {
  const staff = await Staff.findById(id);
  if (!staff) throw new ApiError(404, "Staff member not found");

  // Soft delete by marking inactive
  staff.status = "inactive";
  staff.deletedAt = new Date();
  await staff.save();
}

/**
 * Attendance Log operations
 */
export async function checkIn(
  input: CheckInInput,
  device: AttendanceDeviceContext = {
    source: "admin",
    deviceId: null,
    ipAddress: null,
    userAgent: null,
    actorEmail: null,
  },
): Promise<AttendanceLogDocument> {
  const log = new AttendanceLog({
    type: input.type,
    staffId: input.type === "staff" ? input.staffId : null,
    visitorName: input.type === "visitor" ? input.visitorName : null,
    visitorEmail: input.visitorEmail,
    visitorPhone: input.visitorPhone,
    purpose: input.purpose,
    linkedInspectionId: input.linkedInspectionId || null,
    checkInTime: new Date(),
    notes: input.notes,
    checkedInBy: input.checkedInBy ?? device.actorEmail,
    source: device.source,
    deviceId: device.deviceId,
    deviceIp: device.ipAddress,
    deviceUserAgent: device.userAgent,
    assignedSalesRep: input.assignedSalesRep || null,
  });

  await log.save();
  return log;
}

export async function checkOut(logId: string, notes?: string): Promise<AttendanceLogDocument> {
  const log = await AttendanceLog.findById(logId);
  if (!log) throw new ApiError(404, "Attendance log not found");

  if (log.checkOutTime) throw new ApiError(400, "This entry has already been checked out");

  const checkOutTime = new Date();
  log.checkOutTime = checkOutTime;

  // Calculate duration in minutes
  const durationMs = checkOutTime.getTime() - log.checkInTime.getTime();
  log.durationMinutes = Math.round(durationMs / 60000);

  // Check if no-show (6 hours = 360 minutes without checkout is unlikely, so mark as no-show)
  // Actually, if they just checked out, they're not a no-show. No-show is if they never check out.
  log.isNoShow = false;

  if (notes) log.notes = notes;

  await log.save();
  return log;
}

export async function getAttendanceLog(id: string): Promise<AttendanceLogDocument> {
  const log = await AttendanceLog.findById(id).populate("linkedInspectionId").populate("assignedSalesRep");
  if (!log) throw new ApiError(404, "Attendance log not found");
  return log;
}

export async function listAttendanceLogs(
  filters?: {
    startDate?: Date;
    endDate?: Date;
    type?: "staff" | "visitor";
    department?: string;
    purpose?: string;
    status?: "checked-out" | "no-show" | "pending";
    assignedSalesRep?: string;
  },
  page: number = 1,
  limit: number = 20
): Promise<{ items: AttendanceLogDocument[]; total: number; page: number; limit: number }> {
  const query: Record<string, unknown> = {};

  if (filters?.startDate || filters?.endDate) {
    const checkInTime: { $gte?: Date; $lte?: Date } = {};
    if (filters.startDate) checkInTime.$gte = filters.startDate;
    if (filters.endDate) checkInTime.$lte = filters.endDate;
    query.checkInTime = checkInTime;
  }

  if (filters?.type) query.type = filters.type;
  if (filters?.status === "checked-out") query.checkOutTime = { $ne: null };
  if (filters?.status === "pending") query.checkOutTime = null;
  if (filters?.status === "no-show") query.isNoShow = true;
  if (filters?.purpose) query.purpose = { $regex: filters.purpose, $options: "i" };
  if (filters?.assignedSalesRep) query.assignedSalesRep = filters.assignedSalesRep;

  const [items, total] = await Promise.all([
    AttendanceLog.find(query)
      .populate("staffId", "firstName lastName email department role")
      .populate("linkedInspectionId", "propertyId recommendedArea preferredDate")
      .populate("assignedSalesRep", "firstName lastName email")
      .sort({ checkInTime: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    AttendanceLog.countDocuments(query),
  ]);

  return { items, total, page, limit };
}

/**
 * Auto-flag no-shows: check for attendance logs that have been open for >6h
 */
export async function flagNoShows(): Promise<number> {
  const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000);

  const result = await AttendanceLog.updateMany(
    {
      checkOutTime: null,
      linkedInspectionId: { $ne: null },
      checkInTime: { $lt: sixHoursAgo },
      isNoShow: false,
    },
    { isNoShow: true }
  );

  return result.modifiedCount || 0;
}

/**
 * Fetch open/pending attendance log entries (for quick check-out).
 * `search` matches visitor name directly, or staff name/email/badge via a
 * Staff lookup — without this, the kiosk checkout search only ever saw the
 * 10 most-recently-checked-in entries and couldn't find anyone checked in
 * earlier once more than 10 people were on-site.
 */
export async function getOpenAttendanceLogs(staffId?: string, search?: string): Promise<AttendanceLogDocument[]> {
  const query: Record<string, unknown> = { checkOutTime: null };
  if (staffId) query.staffId = staffId;

  if (search) {
    const matchingStaff = await Staff.find({
      $or: [
        { firstName: { $regex: search, $options: "i" } },
        { lastName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { badgeId: { $regex: search, $options: "i" } },
      ],
    }).select("_id");

    query.$or = [
      { visitorName: { $regex: search, $options: "i" } },
      { staffId: { $in: matchingStaff.map((s) => s._id) } },
    ];
  }

  return AttendanceLog.find(query)
    .populate("staffId", "firstName lastName email")
    .populate("linkedInspectionId", "propertyId recommendedArea")
    .sort({ checkInTime: -1 })
    .limit(search ? 50 : 10);
}

/**
 * Search staff by name, email, or badge ID
 */
export async function searchStaff(query: string): Promise<StaffDocument[]> {
  const results = await Staff.find({
    status: "active",
    $or: [
      { firstName: { $regex: query, $options: "i" } },
      { lastName: { $regex: query, $options: "i" } },
      { email: { $regex: query, $options: "i" } },
      { badgeId: { $regex: query, $options: "i" } },
    ],
  })
    .limit(20)
    .sort({ lastName: 1 });

  return results;
}
