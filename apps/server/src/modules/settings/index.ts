/**
 * Settings module — Phase 7 (docs/IMPLEMENTATION_PLAN.md#phase-7--admin-dashboard).
 *
 * A single global admin-editable settings document consumed by the Decision
 * Engine (property matching weights) and admin UI forms (ROI defaults for
 * new properties). No LLM involvement — plain data read by pure functions.
 */
export { getSettings, getSettingsDocument, updateSettings, type UpdateSettingsInput } from "./settings.service.js";
export { Settings } from "./settings.model.js";
