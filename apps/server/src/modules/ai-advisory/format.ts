/**
 * Presentation formatting for the LLM Advisory Layer — docs/ARCHITECTURE.md#llm-advisory-layer-appsserversrcmodulesai-advisory.
 *
 * AGENTS.md rule #2: the LLM never computes numbers, it only restates
 * whatever the Decision Engine already produced. To make sure it restates
 * them consistently (Nigerian Naira only, exactly 2 decimal places), every
 * currency/decimal figure is pre-formatted into a display string here
 * *before* it ever enters a prompt's context — the LLM is instructed
 * (see prompts/*.md) to use these strings verbatim rather than reformat them
 * itself. Deliberately lives in ai-advisory, not decision-engine: formatting
 * for display is a presentation concern, not business logic.
 */

/** Formats a raw Naira amount as e.g. "₦1,234,567.89". Always exactly 2 decimal places. */
export function formatNaira(amount: number): string {
  return `₦${amount.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** Formats a percentage value (already in percent units, e.g. `12.3` not `0.123`) as e.g. "12.30%". */
export function formatPercent(value: number): string {
  return `${value.toFixed(2)}%`;
}

/** Formats a 0-1 ratio (e.g. affordabilityRatio) as a percentage string, e.g. "34.50%". */
export function formatRatioAsPercent(ratio: number): string {
  return formatPercent(ratio * 100);
}

export interface FormattedBudgetRange {
  min: string;
  max: string;
}

/** Formats a `{ min, max }` budget range into Naira display strings. */
export function formatBudgetRange(range: { min: number; max: number }): FormattedBudgetRange {
  return { min: formatNaira(range.min), max: formatNaira(range.max) };
}
