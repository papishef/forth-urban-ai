import { Router } from "express";
import type { ApiEnvelope } from "../../middleware/error-handler.js";
import { validateBody } from "../../middleware/validate.js";
import { createSubAdminSchema, removeSubAdminSchema, updateSubAdminSchema } from "@forth-urban/validation";
import { requireReauth } from "../auth/auth.middleware.js";
import { createSubAdmin, listEligibleSubAdminUsers, listSubAdmins, removeSubAdmin, updateSubAdmin } from "./sub-admins.service.js";

export const subAdminsAdminRouter: Router = Router();

subAdminsAdminRouter.get("/", async (req, res, next) => {
  try {
    const data = await listSubAdmins(req.auth!.sub);
    const body: ApiEnvelope = { success: true, message: "OK", data, errors: null };
    res.json(body);
  } catch (err) {
    next(err);
  }
});

subAdminsAdminRouter.get("/candidates", async (_req, res, next) => {
  try {
    const data = await listEligibleSubAdminUsers();
    const body: ApiEnvelope = { success: true, message: "OK", data, errors: null };
    res.json(body);
  } catch (err) {
    next(err);
  }
});

subAdminsAdminRouter.post("/", validateBody(createSubAdminSchema), requireReauth(), async (req, res, next) => {
  try {
    const data = await createSubAdmin(req.auth!.sub, req.body);
    const body: ApiEnvelope = { success: true, message: "Sub-admin access granted", data, errors: null };
    res.status(201).json(body);
  } catch (err) {
    next(err);
  }
});

subAdminsAdminRouter.patch("/:id", validateBody(updateSubAdminSchema), requireReauth(), async (req, res, next) => {
  try {
    const data = await updateSubAdmin(req.auth!.sub, req.params.id as string, req.body);
    const body: ApiEnvelope = { success: true, message: "Sub-admin access updated", data, errors: null };
    res.json(body);
  } catch (err) {
    next(err);
  }
});

subAdminsAdminRouter.delete("/:id", validateBody(removeSubAdminSchema), requireReauth(), async (req, res, next) => {
  try {
    await removeSubAdmin(req.auth!.sub, req.params.id as string);
    const body: ApiEnvelope = { success: true, message: "Sub-admin access removed", data: null, errors: null };
    res.json(body);
  } catch (err) {
    next(err);
  }
});