import { Link, useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import { budgetCalculatorInputSchema, type BudgetCalculatorInput } from "@forth-urban/validation";
import { Button, MotionCard, CardContent, CardDescription, CardHeader, CardTitle, Input, Label, PageTransition, Logo } from "@forth-urban/ui";
import { usePropertyDetail } from "../properties/properties-api";
import { useBudgetCalculator } from "./calculators-api";

function formatNaira(amount: number): string {
  return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(
    amount,
  );
}

// Custom animated counter component for the final currency numbers
function AnimatedMoneyValue({ value }: { value: number }) {
  // Rather than complex frame-by-frame physics loops for React strings for this quick transition, 
  // we combine Framer Motion's basic transform with standard React rendering which feels fluid.
  return (
    <motion.span
      key={value}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="inline-block"
    >
      {formatNaira(value)}
    </motion.span>
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
    <PageTransition>
      <div className="min-h-screen bg-gradient-to-br from-[#FFECE4] to-[#fce3d6] px-4 py-10 relative overflow-hidden">
        
        {/* Dynamic Glass Orbs */}
        <div className="absolute top-0 right-0 -m-32 h-[500px] w-[500px] rounded-full bg-white/50 blur-[100px] mix-blend-overlay pointer-events-none" />
        <div className="absolute bottom-0 left-0 -m-32 h-[500px] w-[500px] rounded-full bg-[#d4af37]/10 blur-[120px] pointer-events-none" />

        <div className="mx-auto flex max-w-xl flex-col gap-6 relative z-10">
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={() => navigate(-1)} className="mb-2">
              ← Back
            </Button>
            <Link to="/dashboard">
              <Logo className="h-7" />
            </Link>
          </div>
          <header className="bg-white/40 backdrop-blur-md rounded-2xl p-6 border border-white/50 shadow-sm">
             <div className="h-10 w-10 rounded-full bg-white/60 flex items-center justify-center mb-3 shadow-sm">
                <span className="text-xl">🧮</span>
             </div>
            <p className="font-heading text-3xl font-extrabold text-[#181818]">Budget Calculator</p>
            {propertyResult ? (
              <p className="text-sm font-medium text-[#181818]/70 mt-1">
                 Calculating for: <span className="font-bold text-[#5C4033]">{propertyResult.property.name}</span> — {formatNaira(propertyResult.property.pricePerPlot)} per plot
              </p>
            ) : (
              <p className="h-5 w-48 bg-white/50 animate-pulse rounded mt-1"></p>
            )}
          </header>

          <MotionCard className="bg-white/60 border border-white/50 backdrop-blur-md">
            <CardHeader>
              <CardTitle className="text-xl">Enter your numbers</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5 pt-2" noValidate>
                <div className="space-y-1.5">
                  <Label htmlFor="downPayment">Down payment (NGN)</Label>
                  <Input id="downPayment" type="number" min={0} {...register("downPayment", { valueAsNumber: true })} className="bg-white/50" />
                  {errors.downPayment && <p className="text-sm font-medium text-red-600">{errors.downPayment.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="installmentDurationMonths">Installment duration (months)</Label>
                  <Input
                    id="installmentDurationMonths"
                    type="number"
                    min={1}
                    {...register("installmentDurationMonths", { valueAsNumber: true })}
                    className="bg-white/50"
                  />
                  {errors.installmentDurationMonths && (
                    <p className="text-sm font-medium text-red-600">{errors.installmentDurationMonths.message}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="monthlyIncome">Monthly income/contribution (NGN)</Label>
                  <Input
                    id="monthlyIncome"
                    type="number"
                    min={0}
                    {...register("monthlyIncome", { valueAsNumber: true })}
                    className="bg-white/50"
                  />
                  {errors.monthlyIncome && <p className="text-sm font-medium text-red-600">{errors.monthlyIncome.message}</p>}
                </div>

                <label className="flex items-center gap-3 text-sm font-medium text-[#181818] p-4 border border-[#5C4033]/10 rounded-xl bg-white/30 cursor-pointer hover:bg-white/50 transition-colors">
                  <input type="checkbox" className="h-4 w-4 accent-[#5C4033] rounded" {...register("includeHiddenCosts")} />
                  Include estimated hidden costs (Recommended)
                </label>

                {runCalculator.isError && (
                  <p className="text-sm font-medium text-red-600">Something went wrong. Please check your numbers and try again.</p>
                )}

                <Button type="submit" disabled={runCalculator.isPending} isLoading={runCalculator.isPending} className="mt-2 w-full h-12 text-base">
                  {runCalculator.isPending ? "Calculating…" : "Calculate"}
                </Button>
              </form>
            </CardContent>
          </MotionCard>

          <AnimatePresence>
            {result && (
              <motion.div
                 initial={{ opacity: 0, height: 0, scale: 0.95 }}
                 animate={{ opacity: 1, height: "auto", scale: 1 }}
                 exit={{ opacity: 0, height: 0 }}
                 transition={{ type: "spring", stiffness: 200, damping: 20 }}
                 className="flex flex-col gap-6"
              >
                <MotionCard className="bg-[#5C4033] text-white border-none shadow-xl shadow-[#5C4033]/20 relative overflow-hidden">
                  <div className="absolute inset-0 bg-white/5 pointer-events-none" />
                  <CardHeader className="relative z-10 pb-4">
                    <CardDescription className="text-white/70 uppercase tracking-wider text-xs font-semibold">Monthly installment</CardDescription>
                    <CardTitle className="text-5xl font-black font-heading mt-2">
                       <AnimatedMoneyValue value={result.monthlyInstallment} />
                    </CardTitle>
                    <div className="inline-flex mt-4 items-center rounded-full bg-white/10 px-3 py-1 text-sm font-semibold text-white/90 border border-white/20">
                      {result.affordabilityBandLabel}
                    </div>
                    <CardDescription className="text-white/80 mt-2 text-base">{result.advice}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-2 text-sm text-white/70 relative z-10 pt-2 border-t border-white/10">
                    <div className="flex justify-between">
                       <span>Balance financed:</span>
                       <span className="font-medium text-white">{formatNaira(result.balance)}</span>
                    </div>
                    {result.includeHiddenCosts && (
                      <div className="flex justify-between">
                        <span>Includes estimated hidden costs:</span>
                        <span className="font-medium text-[#d4af37]">{formatNaira(result.hiddenCostTotal)}</span>
                      </div>
                    )}
                    {result.affordabilityRatio != null && (
                      <div className="flex justify-between">
                         <span>Affordability ratio:</span>
                         <span className="font-medium text-white">{(result.affordabilityRatio * 100).toFixed(1)}% of monthly income</span>
                      </div>
                    )}
                  </CardContent>
                </MotionCard>

                <MotionCard className="border-[1.5px] border-[#d4af37]/60 bg-gradient-to-br from-white/80 to-white/40 shadow-xl shadow-[#d4af37]/15">
                  <CardHeader>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="flex h-2.5 w-2.5 rounded-full bg-[#d4af37] animate-pulse" />
                      <CardDescription className="uppercase tracking-wider font-semibold text-[#181818]/60 text-xs">Next Recommended Action</CardDescription>
                    </div>
                    <CardTitle className="text-2xl">{result.nextAction.action}</CardTitle>
                    <CardDescription className="text-[#181818]/80 text-base">{result.nextAction.reason}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button size="lg" className="w-full sm:w-auto shadow-lg shadow-[#5C4033]/20" onClick={() => navigate(`/calculators/hidden-cost/${propertyId}`)}>Continue</Button>
                  </CardContent>
                </MotionCard>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </PageTransition>
  );
}
