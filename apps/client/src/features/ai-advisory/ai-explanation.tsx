import { Card, CardContent, CardDescription, CardHeader } from "@forth-urban/ui";

interface AiExplanationProps {
  title?: string;
  isLoading: boolean;
  isError: boolean;
  text?: string;
  className?: string;
}

/**
 * Renders an LLM Advisory Layer explanation on top of Decision Engine
 * numbers, with a graceful loading/error fallback so a provider outage never
 * blocks the user from seeing the (already-displayed) numbers themselves
 * (docs/IMPLEMENTATION_PLAN.md Phase 5 exit criteria).
 */
export function AiExplanation({ title = "In plain language", isLoading, isError, text, className }: AiExplanationProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardDescription>{title}</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading && <p className="text-sm text-[#181818]/50">Generating your personalized explanation…</p>}
        {!isLoading && (isError || !text) && (
          <p className="text-sm text-[#181818]/50">
            We couldn't generate a personalized explanation right now — the numbers above are accurate either way.
          </p>
        )}
        {!isLoading && !isError && text && <p className="text-sm text-[#181818]/80">{text}</p>}
      </CardContent>
    </Card>
  );
}
