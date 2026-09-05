import type { AttendanceType } from "@forth-urban/validation";

export interface KioskFormData {
  type: AttendanceType;
  staffId?: string;
  staffName?: string;
  visitorName?: string;
  visitorEmail?: string;
  visitorPhone?: string;
  purpose: string;
  linkedInspectionId?: string;
  assignedSalesRep?: string;
  notes?: string;
}

export interface KioskSession {
  currentStep: "welcome" | "type-select" | "staff-lookup" | "check-out" | "visitor-info" | "inspection-link" | "assign-rep" | "success" | "error";
  selectedType?: AttendanceType;
  formData: Partial<KioskFormData>;
  error?: string;
  successMessage?: string;
  lastSubmittedLogId?: string;
}

export interface StaffSearchResult {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  department: string;
  role: string;
  badgeId?: string;
}

export interface InspectionOption {
  _id: string;
  userId: string;
  propertyId?: string;
  recommendedArea?: string;
  inspectionType: "physical" | "virtual";
  preferredDate: string;
}
