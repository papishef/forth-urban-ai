import { Router } from "express";
import { requireAuth } from "../auth/auth.middleware.js";
import { ApiError, type ApiEnvelope } from "../../middleware/error-handler.js";
import { Profile } from "./profile.model.js";
import { toProfileDTO } from "./profile.mapper.js";

export const profilesRouter: Router = Router();

profilesRouter.get("/me", requireAuth, async (req, res, next) => {
  try {
    const profile = await Profile.findOne({ userId: req.auth!.sub });
    if (!profile) throw new ApiError(404, "Complete the Home-Readiness Quiz to create your profile");

    const body: ApiEnvelope = { success: true, message: "OK", data: toProfileDTO(profile), errors: null };
    res.json(body);
  } catch (err) {
    next(err);
  }
});
