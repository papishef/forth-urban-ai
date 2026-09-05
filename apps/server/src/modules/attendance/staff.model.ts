import { Schema, model, type HydratedDocument, type InferSchemaType } from "mongoose";
import { applyBaseSchema } from "../../db/base-schema.plugin.js";

/**
 * `staff` collection — recurring staff members who check in/out at the office.
 * Separate from User model; allows non-admin staff entries.
 *
 * Fields:
 * - firstName, lastName: staff member name
 * - email: unique, for notifications and lookups
 * - phone: optional contact number
 * - department: staff department (e.g., "Sales", "Admin", "Operations")
 * - role: job title (e.g., "Sales Rep", "Manager", "Receptionist")
 * - badgeId: optional barcode/RFID ID for kiosk scanning
 * - status: active/inactive (soft-delete sets inactive)
 */
const staffSchema = new Schema({
  firstName: { type: String, required: true, trim: true, maxlength: 60 },
  lastName: { type: String, required: true, trim: true, maxlength: 60 },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    index: true,
  },
  phone: { type: String, default: null, trim: true },
  department: { type: String, required: true, trim: true, maxlength: 80 },
  role: { type: String, required: true, trim: true, maxlength: 80 },
  badgeId: {
    type: String,
    default: null,
    unique: true,
    sparse: true,
    index: true,
  },
  status: { type: String, enum: ["active", "inactive"], default: "active", index: true },
  deletedAt: { type: Date, default: null },
  version: { type: Number, default: 0 },
});

staffSchema.index({ email: 1, department: 1 });

applyBaseSchema(staffSchema);

export type StaffDocument = HydratedDocument<InferSchemaType<typeof staffSchema>>;

export const Staff = model("Staff", staffSchema);
export const StaffModel = Staff;
