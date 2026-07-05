/**
 * Lightweight CRM module — Phase 6.
 *
 * Owns `crmEvents` (append-only pipeline stage/tags/notes log) and the
 * deterministic recommended-sales-angle copy. Intentionally NOT a full CRM
 * (no routes here — the admin CRM board is Phase 7, `/api/admin/crm`).
 */
export {
  recordLeadEvent,
  recordLeadEventWithSalesAngle,
  getCurrentPipelineStage,
} from "./crm.service.js";
export { getSalesAngle } from "./sales-angle.js";
export { CrmEvent, type CrmEventDocument } from "./crm-event.model.js";
