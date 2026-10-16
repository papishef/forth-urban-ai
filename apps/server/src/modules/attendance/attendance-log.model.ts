import { Schema, model, type HydratedDocument, type InferSchemaType } from "mongoose";
import { applyBaseSchema } from "../../db/base-schema.plugin.js";

/**
 * `attendanceLogs` collection — every check-in/out event for staff and visitors.
 *
 * Fields:
 * - type: "staff" | "visitor" — determines whether staffId or visitorName is used
 * - staffId: ObjectId ref to Staff model (only if type === "staff")
 * - visitorName: name of visitor (only if type === "visitor")
 * - visitorEmail: optional visitor email
 * - visitorPhone: optional visitor phone
 * - purpose: reason for visit (e.g., "inspect property", "meet sales rep", "follow-up")
 * - linkedInspectionId: optional ObjectId ref to InspectionBooking (if visitor is here for a booked inspection)
 * - checkInTime: timestamp when person checked in
 * - checkOutTime: timestamp when person checked out (null until checkout)
 * - durationMinutes: calculated on checkout as (checkOutTime - checkInTime) / 60000
 * - notes: optional notes added during check-in or checkout
 * - checkedInBy: name/ID of person who recorded the check-in (e.g., receptionist or self)
 * - source: whether the record was created from the kiosk or an admin console
 * - deviceId/deviceIp/deviceUserAgent: audit metadata for the check-in device
 * - assignedSalesRep: ObjectId ref to User (sales rep assigned to this visitor)
 * - isNoShow: boolean, auto-set to true if checkOutTime is null and (now - checkInTime) > 360 min (6h)
 */
const attendanceLogSchema = new Schema({
  type: { type: String, enum: ["staff", "visitor"], required: true, index: true },
  staffId: { type: Schema.Types.ObjectId, ref: "Staff", default: null },
  visitorName: { type: String, default: null, trim: true },
  visitorEmail: { type: String, default: null, trim: true, lowercase: true },
  visitorPhone: { type: String, default: null, trim: true },
  purpose: { type: String, default: null, trim: true, maxlength: 200 },
  linkedInspectionId: { type: Schema.Types.ObjectId, ref: "InspectionBooking", default: null, index: true },
  checkInTime: { type: Date, required: true, index: true },
  checkOutTime: { type: Date, default: null },
  durationMinutes: { type: Number, default: null },
  notes: { type: String, default: null, trim: true, maxlength: 500 },
  checkedInBy: { type: String, default: null, trim: true },
  source: { type: String, enum: ["kiosk", "admin"], default: null, index: true },
  deviceId: { type: String, default: null, trim: true, maxlength: 128, index: true },
  deviceIp: { type: String, default: null, trim: true, maxlength: 128 },
  deviceUserAgent: { type: String, default: null, trim: true, maxlength: 500 },
  assignedSalesRep: { type: Schema.Types.ObjectId, ref: "User", default: null },
  isNoShow: { type: Boolean, default: false, index: true },
  deletedAt: { type: Date, default: null },
  version: { type: Number, default: 0 },
});

// Composite indexes for common queries
attendanceLogSchema.index({ staffId: 1, checkInTime: -1 });
attendanceLogSchema.index({ checkInTime: 1, isNoShow: 1 });
attendanceLogSchema.index({ type: 1, checkInTime: -1 });

applyBaseSchema(attendanceLogSchema);

export type AttendanceLogDocument = HydratedDocument<InferSchemaType<typeof attendanceLogSchema>>;

export const AttendanceLog = model("AttendanceLog", attendanceLogSchema);
export const AttendanceLogModel = AttendanceLog;
