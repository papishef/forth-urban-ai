import { Router } from "express";
import { adminPreviewPromptSchema, adminPromptKeySchema, adminUpdatePromptSchema } from "@forth-urban/validation";
import type { AdminPromptDTO, AdminPromptPreviewDTO, AIPromptKey } from "@forth-urban/shared-types";
import { ApiError, type ApiEnvelope } from "../../middleware/error-handler.js";
import { validateBody } from "../../middleware/validate.js";
import { recordAuditLog } from "../../lib/audit-log.service.js";
import { PROMPT_KEYS, getRawPrompt, savePrompt } from "../ai-advisory/prompt-loader.js";
import { getAiAdvisoryService } from "../ai-advisory/ai-advisory.service.js";

/**
 * `GET/PATCH /api/admin/prompts` — Phase 7 AI prompt editor: view/edit the
 * versioned Markdown in `prompts/` and version-bump on save, with a preview
 * call against a sample context before publishing (docs/IMPLEMENTATION_PLAN.md
 * #phase-7--admin-dashboard). AGENTS.md rule #1: prompts stay in `prompts/`,
 * never inline in code — this only reads/writes those files.
 */
export const promptsAdminRouter: Router = Router();

function toDTO(key: AIPromptKey) {
  const { template } = getRawPrompt(key);
  const data: AdminPromptDTO = {
    key,
    version: template.version,
    modelHint: template.modelHint,
    inputs: template.inputs,
    body: template.body,
  };
  return data;
}

promptsAdminRouter.get("/", (_req, res, next) => {
  try {
    const data = PROMPT_KEYS.map((key) => toDTO(key));
    const body: ApiEnvelope = { success: true, message: "OK", data, errors: null };
    res.json(body);
  } catch (err) {
    next(err);
  }
});

promptsAdminRouter.get("/:key", (req, res, next) => {
  try {
    const parsed = adminPromptKeySchema.safeParse(req.params.key);
    if (!parsed.success) throw new ApiError(404, "Unknown prompt key");

    const body: ApiEnvelope = { success: true, message: "OK", data: toDTO(parsed.data), errors: null };
    res.json(body);
  } catch (err) {
    next(err);
  }
});

promptsAdminRouter.patch("/:key", validateBody(adminUpdatePromptSchema), async (req, res, next) => {
  try {
    const parsed = adminPromptKeySchema.safeParse(req.params.key);
    if (!parsed.success) throw new ApiError(404, "Unknown prompt key");

    savePrompt(parsed.data, req.body.body);

    await recordAuditLog({
      actorId: req.auth!.sub,
      actorType: "admin",
      action: "admin.prompt.updated",
      targetType: "Prompt",
      metadata: { promptKey: parsed.data },
    });

    const body: ApiEnvelope = { success: true, message: "Prompt saved", data: toDTO(parsed.data), errors: null };
    res.json(body);
  } catch (err) {
    next(err);
  }
});

promptsAdminRouter.post("/:key/preview", validateBody(adminPreviewPromptSchema), async (req, res, next) => {
  try {
    const parsed = adminPromptKeySchema.safeParse(req.params.key);
    if (!parsed.success) throw new ApiError(404, "Unknown prompt key");

    const result = await getAiAdvisoryService().generate({ promptKey: parsed.data, context: req.body.context });

    const data: AdminPromptPreviewDTO = {
      text: result.text,
      provider: result.provider,
      promptVersion: result.promptVersion,
      degraded: result.degraded,
    };
    const body: ApiEnvelope = { success: true, message: "OK", data, errors: null };
    res.json(body);
  } catch (err) {
    next(err);
  }
});
