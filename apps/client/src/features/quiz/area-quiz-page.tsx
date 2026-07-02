import * as React from "react";
import { useNavigate } from "react-router-dom";
import { Button, Card, CardContent, CardHeader, CardTitle, Progress } from "@forth-urban/ui";
import type { AreaPreference } from "@forth-urban/validation";
import { useStartAreaQuiz, useSubmitAreaQuiz } from "./quiz-api";

const OPTIONS: Array<{ value: AreaPreference; label: string }> = [
  { value: "premiumLiving", label: "Premium, quiet living" },
  { value: "affordableOwnership", label: "Affordable ownership" },
  { value: "cityAccessAffordability", label: "City access + affordability" },
  { value: "familyOriented", label: "Family-oriented" },
  { value: "investmentFocused", label: "Investment-focused" },
  { value: "diasporaBuyer", label: "Buying from abroad" },
];

/** Standalone Best Abuja Area Quiz (PRODUCT_SPEC §12) — one question, same wizard pattern. */
export function AreaQuizPage() {
  const navigate = useNavigate();
  const [selected, setSelected] = React.useState<AreaPreference | null>(null);
  const startQuiz = useStartAreaQuiz();
  const submitQuiz = useSubmitAreaQuiz();
  const startedRef = React.useRef(false);

  React.useEffect(() => {
    if (!startedRef.current) {
      startedRef.current = true;
      startQuiz.mutate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSubmit() {
    if (!selected) return;
    const result = await submitQuiz.mutateAsync({ areaPreference: selected });
    navigate("/quiz/area/result", { state: result });
  }

  return (
    <div className="min-h-screen bg-[#FFECE4] px-4 py-10">
      <div className="mx-auto flex max-w-xl flex-col gap-6">
        <div>
          <p className="mb-2 text-sm font-medium text-[#181818]/60">Step 1 of 1</p>
          <Progress value={100} />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>What matters most to you in an area?</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {OPTIONS.map((option) => (
              <label
                key={option.value}
                className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm transition-colors ${
                  selected === option.value
                    ? "border-[#5C4033] bg-[#FFECE4]"
                    : "border-[#5C4033]/15 bg-white hover:bg-[#FFECE4]/60"
                }`}
              >
                <input
                  type="radio"
                  className="h-4 w-4 accent-[#5C4033]"
                  checked={selected === option.value}
                  onChange={() => setSelected(option.value)}
                />
                {option.label}
              </label>
            ))}
          </CardContent>
        </Card>

        <Button type="button" onClick={handleSubmit} disabled={!selected || submitQuiz.isPending}>
          {submitQuiz.isPending ? "Finding your area…" : "See my recommended area"}
        </Button>
      </div>
    </div>
  );
}
