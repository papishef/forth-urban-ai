import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { roiCalculatorInputSchema, type RoiCalculatorInput } from "@forth-urban/validation";
import type { RoiScenarioKey, RoiScenarioResultDTO } from "@forth-urban/shared-types";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Label } from "@forth-urban/ui";
import { useRoiCalculator } from "./calculators-api";
import { useRoiExplanation } from "../ai-advisory/ai-advisory-api";
import { AiExplanation } from "../ai-advisory/ai-explanation";

function formatNaira(amount: number): string {
  return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(
    amount,
  );
}

const SCENARIO_LABELS: Record<RoiScenarioKey, string> = {
  conservative: "Conservative",
  moderate: "Moderate",
  optimistic: "Optimistic",
};

function ScenarioCard({ scenarioKey, scenario }: { scenarioKey: RoiScenarioKey; scenario: RoiScenarioResultDTO }) {
  return (
    <Card>
      <CardHeader>
        <CardDescription>
          {SCENARIO_LABELS[scenarioKey]} ({(scenario.rate * 100).toFixed(0)}% / year)
        </CardDescription>
        <CardTitle className="text-2xl">{formatNaira(scenario.futureValue)}</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-[#181818]/80">
        <p>Estimated gain: {formatNaira(scenario.estimatedGain)}</p>
        <p>ROI: {scenario.roiPercent.toFixed(1)}%</p>
      </CardContent>
    </Card>
  );
}

/** ROI Calculator (PRODUCT_SPEC §10) — educational appreciation scenarios, admin-editable rates. */
export function RoiCalculatorPage() {
  const { propertyId } = useParams<{ propertyId: string }>();
  const navigate = useNavigate();
  const runCalculator = useRoiCalculator();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RoiCalculatorInput>({
    resolver: zodResolver(roiCalculatorInputSchema),
    defaultValues: { propertyId: propertyId ?? "", years: 5 },
  });

  const result = runCalculator.data;
  const explanation = useRoiExplanation(
    result ? { propertyId: result.propertyId, years: result.years, scenario: "moderate" } : null,
  );

  if (!propertyId) return null;

  async function onSubmit(values: RoiCalculatorInput) {
    await runCalculator.mutateAsync({ ...values, propertyId: propertyId! });
  }

  return (
    <div className="min-h-screen bg-[#FFECE4] px-4 py-10">
      <div className="mx-auto flex max-w-xl flex-col gap-6">
        <header>
          <p className="font-heading text-2xl font-semibold text-[#181818]">ROI Calculator</p>
          <p className="text-sm text-[#181818]/60">Educational appreciation scenarios over time.</p>
        </header>

        <Card>
          <CardHeader>
            <CardTitle>Choose a time horizon</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
              <div>
                <Label htmlFor="years">Years</Label>
                <Input id="years" type="number" min={1} max={50} {...register("years", { valueAsNumber: true })} />
                {errors.years && <p className="text-sm text-red-600">{errors.years.message}</p>}
              </div>

              {runCalculator.isError && (
                <p className="text-sm text-red-600">Something went wrong. Please try again.</p>
              )}

              <Button type="submit" disabled={runCalculator.isPending}>
                {runCalculator.isPending ? "Calculating…" : "Run projection"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {result && (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <ScenarioCard scenarioKey="conservative" scenario={result.scenarios.conservative} />
              <ScenarioCard scenarioKey="moderate" scenario={result.scenarios.moderate} />
              <ScenarioCard scenarioKey="optimistic" scenario={result.scenarios.optimistic} />
            </div>
            <p className="text-xs text-[#181818]/60">{result.disclaimer}</p>

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
              <CardContent>
                <Button
                  onClick={() =>
                    result.nextAction.action.toLowerCase().includes("inspection")
                      ? navigate(`/inspections/book?propertyId=${result.propertyId}`)
                      : navigate("/dashboard")
                  }
                >
                  Continue
                </Button>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
