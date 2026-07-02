/**
 * Users/Profiles module — Phase 1 (users), Phase 2 (profiles).
 *
 * Owns: `users` Mongoose model, GET/PATCH /api/users/me, `profiles` model
 * (upserted by the quiz module on Home-Readiness Quiz completion) and
 * GET /api/profiles/me.
 */
export { User, type UserDocument } from "./user.model.js";
export { usersRouter } from "./users.routes.js";
export { Profile, type ProfileDocument } from "./profile.model.js";
export { profilesRouter } from "./profile.routes.js";


