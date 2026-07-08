import * as React from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button, MotionCard, CardContent, CardDescription, CardHeader, CardTitle, SkeletonGlass, PageTransition, Logo } from "@forth-urban/ui";
import { useHiddenCostCalculator } from "./calculators-api";

function formatNaira(amount: number): string {
  return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(
    amount,
  );
}

// Custom animated counter component for the final currency numbers
function AnimatedMoneyValue({ value }: { value: number }) {
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
    <PageTransition>
      <div className="min-h-screen bg-gradient-to-br from-[#FFECE4] to-[#fce3d6] px-4 py-10 relative overflow-hidden">
        
        {/* Dynamic Glass Orbs */}
        <div className="absolute top-0 right-0 -m-32 h-[500px] w-[500px] rounded-full bg-[#d4af37]/20 blur-[100px] mix-blend-overlay pointer-events-none" />
        <div className="absolute bottom-0 left-0 -m-32 h-[500px] w-[500px] rounded-full bg-white/40 blur-[120px] pointer-events-none" />

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
                <span className="text-xl">📋</span>
             </div>
            <p className="font-heading text-3xl font-extrabold text-[#181818]">Hidden Cost Guide</p>
            <p className="text-sm font-medium text-[#181818]/70 mt-1">
              Survey fee, legal/documentation fee, and other costs beyond the plot price.
            </p>
          </header>

          <AnimatePresence mode="wait">
            {runCalculator.isPending && (
              <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col gap-6">
                 <SkeletonGlass className="h-48 w-full" />
                 <SkeletonGlass className="h-32 w-full" />
              </motion.div>
            )}

            {runCalculator.isError && (
              <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <MotionCard className="bg-white/60 border border-white/50">
                  <CardHeader>
                    <CardTitle className="text-xl text-red-600">Couldn&apos;t load hidden costs</CardTitle>
                    <CardDescription>Please try again or return to the dashboard.</CardDescription>
                  </CardHeader>
                </MotionCard>
              </motion.div>
            )}

            {result && (
              <motion.div
                 key="result"
                 initial={{ opacity: 0, height: 0, scale: 0.95 }}
                 animate={{ opacity: 1, height: "auto", scale: 1 }}
                 transition={{ type: "spring", stiffness: 200, damping: 20 }}
                 className="flex flex-col gap-6"
              >
                <MotionCard className="bg-[#5C4033] text-white border-none shadow-xl shadow-[#5C4033]/20 relative overflow-hidden">
                  <div className="absolute inset-0 bg-white/5 pointer-events-none" />
                  <CardHeader className="relative z-10 pb-4">
                    <CardDescription className="text-white/70 uppercase tracking-wider text-xs font-semibold">Estimated total</CardDescription>
                    <CardTitle className="text-5xl font-black font-heading mt-2">
                       <AnimatedMoneyValue value={result.total} />
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-3 text-sm text-white/80 relative z-10 pt-4 border-t border-white/10">
                    <div className="flex flex-col gap-3">
                      {result.items.map((item, index) => (
                        <motion.div 
                          key={item.key}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="flex items-center justify-between pb-2 border-b border-white/10 last:border-0 last:pb-0"
                        >
                          <span className="font-medium text-white/90">{item.label}</span>
                          <span className="font-bold text-[#d4af37]">{formatNaira(item.amount)}</span>
                        </motion.div>
                      ))}
                    </div>
                    <p className="mt-4 p-3 rounded-lg bg-white/10 border border-white/10 text-xs text-white/70 italic leading-relaxed">
                      * {result.disclaimer}
                    </p>
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
                    <Button size="lg" className="w-full sm:w-auto shadow-lg shadow-[#5C4033]/20" onClick={goToNextAction}>Continue</Button>
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
