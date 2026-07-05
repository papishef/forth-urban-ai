/**
 * Inspections module — Phase 6.
 *
 * Owns the `inspectionBookings` model, `POST /api/inspections`,
 * `GET /api/inspections/me`, and the auto-generated inspection checklist
 * hand-off from the Decision Engine.
 */
export { inspectionsRouter } from "./inspections.routes.js";
export { bookInspection, listMyInspections } from "./inspections.service.js";
