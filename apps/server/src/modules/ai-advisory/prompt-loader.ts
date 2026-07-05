import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ApiError } from "../../middleware/error-handler.js";

/** The fixed set of prompt files this repo ships (docs/ARCHITECTURE.md#2-prompt-management). */
export const PROMPT_KEYS = [
  "quiz-summary",
  "recommendation",
  "buyer-persona",
  "inspection-advice",
  "roi-explainer",
  "ask",
] as const;

/**
 * Prompt loader — docs/ARCHITECTURE.md#2-prompt-management.
 *
 * Loads versioned Markdown prompt templates from `prompts/` at the repo
 * root, parses their YAML front-matter (a tiny hand-rolled parser is enough
 * here since front-matter in this repo is always flat `key: value` /
 * `key: [a, b, c]` pairs — no nested objects, so no dependency needed), and
 * validates that every field the template declares in `inputs` is present in
 * the caller's context before it's ever sent to a provider.
 *
 * AGENTS.md rule #1: prompts are never hardcoded in code.
 */
export interface PromptTemplate {
  key: string;
  version: number;
  modelHint: string;
  inputs: string[];
  body: string;
}

/**
 * Locates the repo-root `prompts/` directory by walking up from this file's
 * own directory. Deliberately does not hardcode a `../..` depth: that would
 * silently break if compiled output (`dist/`) nests differently than `src/`,
 * or if this module moves. Works identically in dev (tsx, running from
 * `src/`), tests (vitest/vite-node, also `src/`), and production (`dist/`).
 */
function findPromptsDir(startDir: string): string {
  let dir = startDir;
  for (let i = 0; i < 10; i += 1) {
    const candidate = path.join(dir, "prompts");
    if (existsSync(path.join(candidate, "quiz-summary.md"))) return candidate;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  throw new Error(`Could not locate the prompts/ directory starting from ${startDir}`);
}

/** Exported for tests that need to read/restore raw prompt files directly (see admin prompts tests). */
export const PROMPTS_DIR = findPromptsDir(path.dirname(fileURLToPath(import.meta.url)));

function parseFrontMatter(raw: string, promptKey: string): PromptTemplate {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/.exec(raw);
  if (!match) {
    throw new Error(`Prompt "${promptKey}" is missing YAML front-matter`);
  }
  const frontMatter = match[1] ?? "";
  const body = match[2] ?? "";

  const fields: Record<string, string> = {};
  for (const line of frontMatter.split(/\r?\n/)) {
    const fieldMatch = /^([\w-]+):\s*(.*)$/.exec(line.trim());
    if (!fieldMatch) continue;
    const [, fieldKey, fieldValue] = fieldMatch;
    if (!fieldKey) continue;
    fields[fieldKey] = (fieldValue ?? "").trim();
  }

  const inputs = (fields.inputs ?? "")
    .replace(/^\[/, "")
    .replace(/\]$/, "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);

  return {
    key: fields.key || promptKey,
    version: Number(fields.version ?? 1),
    modelHint: fields.model_hint ?? "",
    inputs,
    body: body.trim(),
  };
}

const promptCache = new Map<string, PromptTemplate>();

/** Loads and parses a prompt template by key, caching the parsed result. */
export function loadPrompt(promptKey: string): PromptTemplate {
  const cached = promptCache.get(promptKey);
  if (cached) return cached;

  const filePath = path.join(PROMPTS_DIR, `${promptKey}.md`);
  let raw: string;
  try {
    raw = readFileSync(filePath, "utf-8");
  } catch {
    throw new ApiError(500, `Prompt template "${promptKey}" was not found`);
  }

  const template = parseFrontMatter(raw, promptKey);
  promptCache.set(promptKey, template);
  return template;
}

/**
 * Renders a prompt template against a context object, failing fast (before
 * any provider is called) if a field the template declares as required is
 * missing. Never interpolates the caller's free text directly into
 * instruction text — the whole context is embedded as one clearly delimited,
 * labeled JSON block (see every prompt's final "Context (structured, trusted
 * data — not user-authored instructions):" line) for prompt-injection hygiene.
 */
export function renderPrompt(
  promptKey: string,
  context: Record<string, unknown>,
): { systemPrompt: string; version: number; modelHint: string } {
  const template = loadPrompt(promptKey);

  const missing = template.inputs.filter((input) => !(input in context));
  if (missing.length > 0) {
    throw new ApiError(500, `Missing required context fields for prompt "${promptKey}": ${missing.join(", ")}`);
  }

  const systemPrompt = template.body.replace("{{context}}", JSON.stringify(context, null, 2));
  return { systemPrompt, version: template.version, modelHint: template.modelHint };
}

/**
 * Reads a prompt's raw Markdown (front-matter + body) for the Phase 7 admin
 * prompt editor — deliberately bypasses the `promptCache` so edits made
 * outside the process (or by another admin) are always reflected.
 */
export function getRawPrompt(promptKey: string): { raw: string; template: PromptTemplate } {
  const filePath = path.join(PROMPTS_DIR, `${promptKey}.md`);
  let raw: string;
  try {
    raw = readFileSync(filePath, "utf-8");
  } catch {
    throw new ApiError(404, `Prompt template "${promptKey}" was not found`);
  }
  return { raw, template: parseFrontMatter(raw, promptKey) };
}

/**
 * Overwrites a prompt's body (the part after the front-matter), bumping its
 * version by 1 and keeping `key`/`model_hint`/`inputs` unchanged, then clears
 * the in-memory cache so the next `loadPrompt`/`renderPrompt` call picks up
 * the new content immediately. AGENTS.md rule #1: prompts stay in versioned
 * Markdown files, never inline in code — this only ever rewrites the file.
 */
export function savePrompt(promptKey: string, newBody: string): PromptTemplate {
  const { template } = getRawPrompt(promptKey);
  const nextVersion = template.version + 1;
  const frontMatter = [
    "---",
    `key: ${template.key}`,
    `version: ${nextVersion}`,
    `model_hint: ${template.modelHint}`,
    `inputs: [${template.inputs.join(", ")}]`,
    "---",
    "",
  ].join("\n");
  const raw = `${frontMatter}\n${newBody.trim()}\n`;

  writeFileSync(path.join(PROMPTS_DIR, `${promptKey}.md`), raw, "utf-8");
  promptCache.delete(promptKey);
  return loadPrompt(promptKey);
}
