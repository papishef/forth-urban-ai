import * as React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@forth-urban/ui";
import { useHiddenCostCalculator } from "./calculators-api";

function formatNaira(amount: number): string {
  return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(
    amount,
  );
}

/** Hidden Cost Guide (PRODUCT_SPEC §9) — runs automatically for the selected property. */
export function HiddenCostCalculatorPage() {
  const { propertyId } = useParams<{ propertyId: string }>();
  const navigate = useNavigate();
  const runCalculator = useHiddenCostCalculator();
  const requestedRef = React.useRef(false);

  React.useEffect(() => {
    if (!requestedRef.current && propertyId) {
      requestedRef.current = true;
      runCalculator.mutate({ propertyId });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [propertyId]);

  if (!propertyId) return null;

  const result = runCalculator.data;

  function goToNextAction() {
    if (!result) return;
    const action = result.nextAction.action.toLowerCase();
    if (action.includes("roi")) {
      navigate(`/calculators/roi/${propertyId}`);
    } else if (action.includes("inspection")) {
      navigate(`/inspections/book?propertyId=${propertyId}`);
    } else {
      navigate("/dashboard");
    }
  }

  return (
    <div className="min-h-screen bg-[#FFECE4] px-4 py-10">
      <div className="mx-auto flex max-w-xl flex-col gap-6">
        <header>
          <p className="font-heading text-2xl font-semibold text-[#181818]">Hidden Cost Guide</p>
          <p className="text-sm text-[#181818]/60">
            Survey fee, legal/documentation fee, and other costs beyond the plot price.
          </p>
        </header>

        {runCalculator.isPending && (
          <p className="text-center text-[#181818]/60">Calculating hidden costs…</p>
        )}

        {runCalculator.isError && (
          <Card>
            <CardHeader>
              <CardTitle>Couldn&apos;t load hidden costs</CardTitle>
              <CardDescription>Please try again.</CardDescription>
            </CardHeader>
          </Card>
        )}

        {result && (
          <>
            <Card>
              <CardHeader>
                <CardDescription>Estimated total</CardDescription>
                <CardTitle className="text-3xl">{formatNaira(result.total)}</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-2 text-sm text-[#181818]/80">
                {result.items.map((item) => (
                  <div key={item.key} className="flex items-center justify-between">
                    <span>{item.label}</span>
                    <span className="font-medium text-[#181818]">{formatNaira(item.amount)}</span>
                  </div>
                ))}
                <p className="mt-2 text-xs text-[#181818]/60">{result.disclaimer}</p>
              </CardContent>
            </Card>

            <Card className="border-2 border-[#5C4033]">
              <CardHeader>
                <CardDescription>Next recommended action</CardDescription>
                <CardTitle>{result.nextAction.action}</CardTitle>
                <CardDescription>{result.nextAction.reason}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={goToNextAction}>Continue</Button>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
