/**
 * Properties module — Phase 3.
 *
 * Owns the `properties` and `recommendations` models, property matching via
 * the Decision Engine, GET /api/properties, GET /api/properties/:id, and
 * GET /api/recommendations/properties. Cloudinary media upload helper lives
 * at ../../lib/cloudinary.util.ts, ready for the Phase 7 admin CRUD.
 */
export { propertiesRouter } from "./property.routes.js";
export { recommendationsRouter } from "./recommendation.routes.js";
export { Property, type PropertyDocument } from "./property.model.js";
export { toPropertyDTO, toPropertyListItemDTO } from "./property.mapper.js";
