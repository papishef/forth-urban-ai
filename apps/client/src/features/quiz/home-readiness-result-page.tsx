import { useLocation, useNavigate } from "react-router-dom";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@forth-urban/ui";
import type { HomeReadinessResultDTO } from "@forth-urban/shared-types";
import { useHomeReadinessResult } from "./quiz-api";
import { useQuizSummaryExplanation } from "../ai-advisory/ai-advisory-api";
import { AiExplanation } from "../ai-advisory/ai-explanation";

/** Readiness score + highlighted "next recommended action" result screen (PRODUCT_SPEC §16). */
export function HomeReadinessResultPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const stateResult = location.state as HomeReadinessResultDTO | undefined;
  const { data: fetchedResult, isLoading } = useHomeReadinessResult(!stateResult);
  const result = stateResult ?? fetchedResult;
  const explanation = useQuizSummaryExplanation(Boolean(result));

  if (!result && isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FFECE4] px-4 py-10 text-[#181818]/60">
        Loading your result…
      </div>
    );
  }

  if (!result) {
    return (
      <div className="min-h-screen bg-[#FFECE4] px-4 py-10">
        <div className="mx-auto max-w-xl text-center">
          <p className="mb-4 text-[#181818]/70">Take the Home-Readiness Quiz to see your result.</p>
          <Button onClick={() => navigate("/quiz/home-readiness")}>Start the quiz</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFECE4] px-4 py-10">
      <div className="mx-auto flex max-w-xl flex-col gap-6">
        <Card>
          <CardHeader>
            <CardDescription>Your readiness score</CardDescription>
            <CardTitle className="text-4xl">{result.score}/100</CardTitle>
            <CardDescription>{result.bandLabel}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-[#181818]/70">
              Buyer profile: <span className="font-medium text-[#181818]">{result.persona}</span>
            </p>
          </CardContent>
        </Card>

        <AiExplanation
          isLoading={explanation.isLoading}
          isError={explanation.isError}
          text={explanation.data?.text}
        />

        <Card className="border-2 border-[#5C4033]">
          <CardHeader>
            <CardDescription>Next recommended action</CardDescription>
            <CardTitle>{result.nextAction.action}</CardTitle>
            <CardDescription>{result.nextAction.reason}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Button onClick={() => navigate("/properties/recommended")}>View matched properties</Button>
            <Button variant="secondary" onClick={() => navigate("/dashboard")}>
              Go to dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
