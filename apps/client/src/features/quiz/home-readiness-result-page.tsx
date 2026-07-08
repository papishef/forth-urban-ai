import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button, MotionCard, CardContent, CardDescription, CardHeader, CardTitle, SkeletonGlass, PageTransition, Logo } from "@forth-urban/ui";
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
      <PageTransition>
        <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-[#FFECE4] to-[#fce3d6] px-4 py-10 gap-6">
          <SkeletonGlass className="h-[200px] w-full max-w-xl" />
          <SkeletonGlass className="h-[300px] w-full max-w-xl" />
          <SkeletonGlass className="h-[150px] w-full max-w-xl" />
        </div>
      </PageTransition>
    );
  }

  if (!result) {
    return (
      <PageTransition>
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#FFECE4] to-[#fce3d6] px-4 py-10">
          <MotionCard className="mx-auto max-w-xl text-center p-8 border-white/40">
            <h2 className="mb-4 text-2xl font-bold font-heading text-[#181818]">No Results Found</h2>
            <p className="mb-8 text-[#181818]/70">Take the Home-Readiness Quiz to receive your personalized profile and property matches.</p>
            <Button size="lg" className="w-full" onClick={() => navigate("/quiz/home-readiness")}>Start the quiz</Button>
          </MotionCard>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-gradient-to-br from-[#FFECE4] to-[#fce3d6] px-4 py-10 relative overflow-hidden">
        
        {/* Dynamic Glass Orbs based on Score Band */}
        <div className="absolute top-0 right-0 -m-32 h-[600px] w-[600px] rounded-full bg-[#d4af37]/20 blur-[120px] mix-blend-multiply" />
        <div className="absolute bottom-0 left-0 -m-32 h-[500px] w-[500px] rounded-full bg-white/50 blur-[100px] mix-blend-overlay" />

        <div className="mx-auto flex max-w-xl flex-col gap-6 relative z-10 pt-8">
          <Link to="/dashboard" className="self-start">
            <Logo className="h-7" />
          </Link>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <MotionCard className="overflow-hidden border-white/50">
              <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent pointer-events-none" />
              <CardHeader className="text-center pb-2 relative z-10">
                <CardDescription className="text-sm font-semibold tracking-wider text-[#5C4033] uppercase">Your Readiness Score</CardDescription>
                <div className="py-6 flex justify-center">
                   <div className="relative flex items-center justify-center w-36 h-36 rounded-full border-[6px] border-[#d4af37]/20 bg-white/30 backdrop-blur-sm shadow-xl shadow-[#d4af37]/10">
                      <motion.div 
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.3 }}
                        className="text-5xl font-black font-heading bg-clip-text text-transparent bg-gradient-to-b from-[#181818] to-[#5C4033]"
                      >
                        {result.score}
                      </motion.div>
                   </div>
                </div>
                <CardDescription className="text-lg font-medium text-[#181818]">{result.bandLabel}</CardDescription>
              </CardHeader>
              <CardContent className="text-center pb-6 relative z-10">
                <div className="inline-block rounded-full bg-white/60 px-4 py-1.5 shadow-sm border border-white/40">
                  <p className="text-sm text-[#181818]/80">
                    Buyer profile: <span className="font-bold text-[#5C4033]">{result.persona}</span>
                  </p>
                </div>
              </CardContent>
            </MotionCard>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <AiExplanation
              isLoading={explanation.isLoading}
              isError={explanation.isError}
              text={explanation.data?.text}
            />
          </motion.div>

          {/* Special CTA Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <MotionCard className="border-[1.5px] border-[#d4af37]/60 bg-gradient-to-br from-white/70 to-white/40 shadow-xl shadow-[#d4af37]/15">
              <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                  <span className="flex h-2.5 w-2.5 rounded-full bg-[#d4af37] animate-pulse" />
                  <CardDescription className="uppercase tracking-wider font-semibold text-[#181818]/60 text-xs">Next Recommended Action</CardDescription>
                </div>
                <CardTitle className="text-2xl">{result.nextAction.action}</CardTitle>
                <CardDescription className="text-[#181818]/80 text-base">{result.nextAction.reason}</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col sm:flex-row gap-3">
                <Button size="lg" className="w-full sm:w-auto shadow-lg shadow-[#5C4033]/20" onClick={() => navigate("/properties/recommended")}>View matched properties</Button>
                <Button size="lg" variant="secondary" className="w-full sm:w-auto bg-white/80" onClick={() => navigate("/dashboard")}>
                  Go to dashboard
                </Button>
              </CardContent>
            </MotionCard>
          </motion.div>
        </div>
      </div>
    </PageTransition>
  );
}
