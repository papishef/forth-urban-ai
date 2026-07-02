import { Router } from "express";
import { requireAuth } from "../auth/auth.middleware.js";
import { ApiError, type ApiEnvelope } from "../../middleware/error-handler.js";
import { User } from "./user.model.js";
import { toUserDTO } from "./user.mapper.js";

export const usersRouter: Router = Router();

usersRouter.get("/me", requireAuth, async (req, res, next) => {
  try {
    const user = await User.findById(req.auth!.sub);
    if (!user) throw new ApiError(404, "User not found");

    const body: ApiEnvelope = {
      success: true,
      message: "OK",
      data: toUserDTO(user),
      errors: null,
    };
    res.json(body);
  } catch (err) {
    next(err);
  }
});

const PATCHABLE_FIELDS = [
  "firstName",
  "lastName",
  "whatsappNumber",
  "currentCity",
  "currentCountry",
  "isDiaspora",
] as const;

usersRouter.patch("/me", requireAuth, async (req, res, next) => {
  try {
    const user = await User.findById(req.auth!.sub);
    if (!user) throw new ApiError(404, "User not found");

    for (const field of PATCHABLE_FIELDS) {
      if (field in req.body) {
        user.set(field, req.body[field]);
      }
    }
    await user.save();

    const body: ApiEnvelope = {
      success: true,
      message: "Profile updated",
      data: toUserDTO(user),
      errors: null,
    };
    res.json(body);
  } catch (err) {
    next(err);
  }
});
