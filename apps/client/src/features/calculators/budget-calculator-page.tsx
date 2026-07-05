import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { budgetCalculatorInputSchema, type BudgetCalculatorInput } from "@forth-urban/validation";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Label } from "@forth-urban/ui";
import { usePropertyDetail } from "../properties/properties-api";
import { useBudgetCalculator } from "./calculators-api";

function formatNaira(amount: number): string {
  return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(
    amount,
  );
}

/** Budget & Installment Calculator (PRODUCT_SPEC §8) — the next action after viewing a property card. */
export function BudgetCalculatorPage() {
  const { propertyId } = useParams<{ propertyId: string }>();
  const navigate = useNavigate();
  const { data: propertyResult } = usePropertyDetail(propertyId);
  const runCalculator = useBudgetCalculator();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<BudgetCalculatorInput>({
    resolver: zodResolver(budgetCalculatorInputSchema),
    defaultValues: {
      propertyId: propertyId ?? "",
      downPayment: 0,
      installmentDurationMonths: 12,
      monthlyIncome: 0,
      includeHiddenCosts: false,
    },
  });

  if (!propertyId) return null;

  async function onSubmit(values: BudgetCalculatorInput) {
    await runCalculator.mutateAsync({ ...values, propertyId: propertyId! });
  }

  const result = runCalculator.data;

  return (
    <div className="min-h-screen bg-[#FFECE4] px-4 py-10">
      <div className="mx-auto flex max-w-xl flex-col gap-6">
        <header>
          <p className="font-heading text-2xl font-semibold text-[#181818]">Budget & Installment Calculator</p>
          {propertyResult && (
            <p className="text-sm text-[#181818]/60">
              {propertyResult.property.name} — {formatNaira(propertyResult.property.pricePerPlot)} per plot
            </p>
          )}
        </header>

        <Card>
          <CardHeader>
            <CardTitle>Enter your numbers</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
              <div>
                <Label htmlFor="downPayment">Down payment (NGN)</Label>
                <Input id="downPayment" type="number" min={0} {...register("downPayment", { valueAsNumber: true })} />
                {errors.downPayment && <p className="text-sm text-red-600">{errors.downPayment.message}</p>}
              </div>

              <div>
                <Label htmlFor="installmentDurationMonths">Installment duration (months)</Label>
                <Input
                  id="installmentDurationMonths"
                  type="number"
                  min={1}
                  {...register("installmentDurationMonths", { valueAsNumber: true })}
                />
                {errors.installmentDurationMonths && (
                  <p className="text-sm text-red-600">{errors.installmentDurationMonths.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="monthlyIncome">Monthly income/contribution (NGN)</Label>
                <Input
                  id="monthlyIncome"
                  type="number"
                  min={0}
                  {...register("monthlyIncome", { valueAsNumber: true })}
                />
                {errors.monthlyIncome && <p className="text-sm text-red-600">{errors.monthlyIncome.message}</p>}
              </div>

              <label className="flex items-center gap-2 text-sm text-[#181818]/80">
                <input type="checkbox" className="h-4 w-4 accent-[#5C4033]" {...register("includeHiddenCosts")} />
                Include estimated hidden costs
              </label>

              {runCalculator.isError && (
                <p className="text-sm text-red-600">Something went wrong. Please check your numbers and try again.</p>
              )}

              <Button type="submit" disabled={runCalculator.isPending}>
                {runCalculator.isPending ? "Calculating…" : "Calculate"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {result && (
          <>
            <Card>
              <CardHeader>
                <CardDescription>Monthly installment</CardDescription>
                <CardTitle className="text-3xl">{formatNaira(result.monthlyInstallment)}</CardTitle>
                <CardDescription>
                  {result.affordabilityBandLabel} — {result.advice}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-1 text-sm text-[#181818]/80">
                <p>Balance financed: {formatNaira(result.balance)}</p>
                {result.includeHiddenCosts && (
                  <p>Includes estimated hidden costs: {formatNaira(result.hiddenCostTotal)}</p>
                )}
                {result.affordabilityRatio != null && (
                  <p>Affordability ratio: {(result.affordabilityRatio * 100).toFixed(1)}% of monthly income</p>
                )}
              </CardContent>
            </Card>

            <Card className="border-2 border-[#5C4033]">
              <CardHeader>
                <CardDescription>Next recommended action</CardDescription>
                <CardTitle>{result.nextAction.action}</CardTitle>
                <CardDescription>{result.nextAction.reason}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={() => navigate(`/calculators/hidden-cost/${propertyId}`)}>Continue</Button>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
