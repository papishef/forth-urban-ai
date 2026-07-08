import { Link, useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import { roiCalculatorInputSchema, type RoiCalculatorInput } from "@forth-urban/validation";
import type { RoiScenarioKey, RoiScenarioResultDTO } from "@forth-urban/shared-types";
import { Button, MotionCard, CardContent, CardDescription, CardHeader, CardTitle, Input, Label, PageTransition, Logo } from "@forth-urban/ui";
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

// Custom animated counter
function AnimatedMoneyValue({ value, className = "" }: { value: number; className?: string }) {
  return (
    <motion.div
      key={value}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className={`inline-block ${className}`}
    >
      {formatNaira(value)}
    </motion.div>
  );
}

function ScenarioCard({ scenarioKey, scenario, index }: { scenarioKey: RoiScenarioKey; scenario: RoiScenarioResultDTO; index: number }) {
  // Determine premium theme map based on scenario
  const themeMap = {
    conservative: "from-white/60 to-white/30 border-white/50 text-[#181818]",
    moderate: "from-[#5C4033] to-[#4a3329] border-none text-white shadow-lg shadow-[#5C4033]/20",
    optimistic: "from-[#d4af37]/20 to-transparent border-[#d4af37]/30 text-[#181818]",
  };

  const isModerate = scenarioKey === "moderate";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, type: "spring" }}
      className="h-full"
    >
      <MotionCard className={`h-full bg-gradient-to-br ${themeMap[scenarioKey]} overflow-hidden relative`}>
        {isModerate && <div className="absolute inset-0 bg-white/5 mix-blend-overlay pointer-events-none" />}
        <CardHeader className="relative z-10">
          <div className="flex justify-between items-start mb-2">
            <CardDescription className={`text-xs font-semibold uppercase tracking-wider ${isModerate ? "text-white/70" : "text-[#181818]/60"}`}>
              {SCENARIO_LABELS[scenarioKey]}
            </CardDescription>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${isModerate ? "bg-white/20 text-white" : "bg-white/50 text-[#5C4033]"}`}>
              {(scenario.rate * 100).toFixed(0)}%/yr
            </span>
          </div>
          <CardTitle className={`text-2xl sm:text-3xl font-heading ${isModerate ? "text-white" : "text-[#181818]"}`}>
            <AnimatedMoneyValue value={scenario.futureValue} />
          </CardTitle>
        </CardHeader>
        <CardContent className={`text-sm ${isModerate ? "text-white/80" : "text-[#181818]/80"} relative z-10`}>
          <div className={`mt-2 pt-3 border-t ${isModerate ? "border-white/10" : "border-[#181818]/10"} flex flex-col gap-1`}>
             <p className="flex justify-between"><span>Est. gain:</span> <span className={`font-semibold ${isModerate ? "text-white" : "text-[#5C4033]"}`}>{formatNaira(scenario.estimatedGain)}</span></p>
             <p className="flex justify-between"><span>ROI:</span> <span className="font-bold text-[#d4af37]">+{scenario.roiPercent.toFixed(1)}%</span></p>
          </div>
        </CardContent>
      </MotionCard>
    </motion.div>
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
    <PageTransition>
      <div className="min-h-screen bg-gradient-to-br from-[#FFECE4] to-[#fce3d6] px-4 py-10 relative overflow-hidden">
        {/* Dynamic Glass Orbs */}
        <div className="absolute top-1/4 right-0 -m-32 h-[600px] w-[600px] rounded-full bg-[#d4af37]/15 blur-[120px] mix-blend-multiply pointer-events-none" />
        <div className="absolute bottom-0 left-0 -m-32 h-[500px] w-[500px] rounded-full bg-white/40 blur-[100px] pointer-events-none" />

        <div className="mx-auto flex max-w-4xl flex-col gap-6 relative z-10">
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={() => navigate(-1)} className="mb-2">
              ← Back
            </Button>
            <Link to="/dashboard">
              <Logo className="h-7" />
            </Link>
          </div>
          <header className="bg-white/40 backdrop-blur-md rounded-2xl p-6 border border-white/50 shadow-sm max-w-xl">
             <div className="h-10 w-10 rounded-full bg-white/60 flex items-center justify-center mb-3 shadow-sm">
                <span className="text-xl">📈</span>
             </div>
            <p className="font-heading text-3xl font-extrabold text-[#181818]">ROI Calculator</p>
            <p className="text-sm font-medium text-[#181818]/70 mt-1">Educational appreciation scenarios over time driven by real market data.</p>
          </header>

          <MotionCard className="bg-white/60 border border-white/50 max-w-xl">
            <CardHeader>
              <CardTitle className="text-xl">Choose a time horizon</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col sm:flex-row items-start sm:items-end gap-4" noValidate>
                <div className="flex-1 w-full space-y-1.5">
                  <Label htmlFor="years">Years to hold</Label>
                  <Input id="years" type="number" min={1} max={50} {...register("years", { valueAsNumber: true })} className="bg-white/50" />
                  {errors.years && <p className="text-sm font-medium text-red-600">{errors.years.message}</p>}
                </div>
                {runCalculator.isError && (
                  <p className="text-sm font-medium text-red-600 w-full">Something went wrong. Please try again.</p>
                )}
                <Button type="submit" disabled={runCalculator.isPending} isLoading={runCalculator.isPending} className="w-full sm:w-auto mt-2 sm:mt-0 shadow-lg shadow-[#5C4033]/10 h-12">
                  {runCalculator.isPending ? "Calculating…" : "Run projection"}
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
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <ScenarioCard scenarioKey="conservative" scenario={result.scenarios.conservative} index={0} />
                  <ScenarioCard scenarioKey="moderate" scenario={result.scenarios.moderate} index={1} />
                  <ScenarioCard scenarioKey="optimistic" scenario={result.scenarios.optimistic} index={2} />
                </div>
                
                <motion.p 
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
                  className="text-xs text-[#181818]/60 p-3 rounded-lg bg-white/30 border border-white/40 italic"
                >
                  * {result.disclaimer}
                </motion.p>

                <div className="max-w-3xl">
                  <AiExplanation
                    isLoading={explanation.isLoading}
                    isError={explanation.isError}
                    text={explanation.data?.text}
                  />
                </div>

                <MotionCard className="border-[1.5px] border-[#d4af37]/60 bg-gradient-to-br from-white/80 to-white/40 shadow-xl shadow-[#d4af37]/15 max-w-xl">
                  <CardHeader>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="flex h-2.5 w-2.5 rounded-full bg-[#d4af37] animate-pulse" />
                      <CardDescription className="uppercase tracking-wider font-semibold text-[#181818]/60 text-xs">Next Recommended Action</CardDescription>
                    </div>
                    <CardTitle className="text-2xl">{result.nextAction.action}</CardTitle>
                    <CardDescription className="text-[#181818]/80 text-base">{result.nextAction.reason}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button
                      size="lg"
                      className="w-full sm:w-auto shadow-lg shadow-[#5C4033]/20"
                      onClick={() =>
                        result.nextAction.action.toLowerCase().includes("inspection")
                          ? navigate(`/inspections/book?propertyId=${result.propertyId}`)
                          : navigate("/dashboard")
                      }
                    >
                      Continue
                    </Button>
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
