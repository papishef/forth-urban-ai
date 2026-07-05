/**
 * Areas module — Phase 7 (docs/ARCHITECTURE.md §9 "an areas admin table
 * driving the Area Quiz logic instead of hardcoded areas").
 *
 * Admin-managed override for decision-engine/area-matching.ts's hardcoded
 * `AREA_PREFERENCE_MATCH` lookup. Read by `modules/quiz` at Area Quiz
 * submission time; written by `modules/admin`.
 */
export {
  listAreas,
  upsertArea,
  deleteArea,
  getAreaOverridesMap,
  type UpsertAreaInput,
} from "./area.service.js";
export { Area } from "./area.model.js";
