import * as React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion } from "framer-motion";
import { Button, MotionCard, CardContent, CardHeader, CardTitle, Input, Label, Progress, PageTransition, Logo } from "@forth-urban/ui";
import { homeReadinessAnswersSchema, type HomeReadinessAnswers } from "@forth-urban/validation";
import { useStartHomeReadinessQuiz, useSubmitHomeReadinessQuiz } from "./quiz-api";

type StepId =
  | "buyerGoal"
  | "budgetRange"
  | "monthlyIncome"
  | "paymentStyle"
  | "timeline"
  | "preferredArea"
  | "lifestylePreference"
  | "biggestFear"
  | "inspectionPreference";

interface Step {
  id: StepId;
  question: string;
  description?: string;
  fields: Array<keyof HomeReadinessAnswers>;
}

const STEPS: Step[] = [
  { id: "buyerGoal", question: "Why do you want a property?", description: "Help us understand your core objective.", fields: ["buyerGoal"] },
  { id: "budgetRange", question: "What initial budget can you start with?", description: "Tell us your initial budget (NGN).", fields: ["budgetRange"] },
  { id: "monthlyIncome", question: "What payment pressure can you handle?", description: "Your safe monthly contribution limit.", fields: ["monthlyIncome"] },
  { id: "paymentStyle", question: "One-time or installment?", description: "How you prefer to structure payments.", fields: ["paymentStyle"] },
  { id: "timeline", question: "When do you want to buy?", description: "Helps us match you with ready properties.", fields: ["timeline"] },
  { id: "preferredArea", question: "Where in Abuja are you considering?", description: "Your target location in Abuja.", fields: ["preferredArea"] },
  { id: "lifestylePreference", question: "What environment fits you?", description: "Your ideal neighborhood vibe.", fields: ["lifestylePreference"] },
  { id: "biggestFear", question: "What is stopping you?", description: "We'll tailor advice to your concerns.", fields: ["biggestFear"] },
  { id: "inspectionPreference", question: "How would you like to verify the land?", description: "Choose your next action step.", fields: ["inspectionPreference"] },
];

const RADIO_OPTIONS: Partial<Record<StepId, Array<{ value: string; label: string }>>> = {
  buyerGoal: [
    { value: "investment", label: "Investment" },
    { value: "residential", label: "Somewhere to live" },
    { value: "family", label: "Family land" },
    { value: "diaspora", label: "Building from abroad" },
    { value: "firstTime", label: "First time buying land" },
  ],
  paymentStyle: [
    { value: "oneTime", label: "One-time payment" },
    { value: "installment", label: "Installment plan" },
  ],
  timeline: [
    { value: "now", label: "Right now" },
    { value: "in3To6Months", label: "In 3–6 months" },
    { value: "in6To12Months", label: "In 6–12 months" },
    { value: "justExploring", label: "Just exploring" },
  ],
  lifestylePreference: [
    { value: "premiumQuiet", label: "Premium & quiet" },
    { value: "affordableStarter", label: "Affordable starter area" },
    { value: "cityAccess", label: "Close to the city" },
    { value: "familyFriendly", label: "Family-friendly" },
    { value: "investmentGrowth", label: "High growth potential" },
  ],
  biggestFear: [
    { value: "scamFear", label: "Fear of being scammed" },
    { value: "documentation", label: "Documentation & title concerns" },
    { value: "hiddenCosts", label: "Hidden costs" },
    { value: "locationConfusion", label: "Not sure which area fits" },
    { value: "delayedAllocation", label: "Delayed allocation" },
    { value: "affordability", label: "Affordability" },
  ],
  inspectionPreference: [
    { value: "physical", label: "Physical site inspection" },
    { value: "virtual", label: "Virtual video inspection" },
    { value: "documentReviewFirst", label: "Document review call first" },
    { value: "advisorCallFirst", label: "Advisor call first" },
  ],
};

/** One-question-per-screen Home-Readiness Quiz wizard (PRODUCT_SPEC §4, §16). */
export function HomeReadinessQuizPage() {
  const navigate = useNavigate();
  const [stepIndex, setStepIndex] = React.useState(0);
  const startQuiz = useStartHomeReadinessQuiz();
  const submitQuiz = useSubmitHomeReadinessQuiz();
  const startedRef = React.useRef(false);

  const {
    register,
    watch,
    setValue,
    trigger,
    handleSubmit,
    formState: { errors },
  } = useForm<HomeReadinessAnswers>({
    resolver: zodResolver(homeReadinessAnswersSchema),
    defaultValues: {
      budgetRange: { min: 0, max: 0 },
      monthlyIncome: 0,
      preferredArea: "",
    },
  });

  React.useEffect(() => {
    if (!startedRef.current) {
      startedRef.current = true;
      startQuiz.mutate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const step = STEPS[stepIndex]!;
  const isLastStep = stepIndex === STEPS.length - 1;

  const selectedValue = watch(step.id as keyof HomeReadinessAnswers) as string | undefined;

  async function goNext() {
    const valid = await trigger(step.fields);
    if (!valid) return;

    if (isLastStep) {
      await handleSubmit(async (values) => {
        const result = await submitQuiz.mutateAsync(values);
        navigate("/quiz/home-readiness/result", { state: result });
      })();
      return;
    }
    setStepIndex((i) => i + 1);
  }

  function goBack() {
    if (stepIndex === 0) {
      navigate("/dashboard");
    } else {
      setStepIndex((i) => Math.max(0, i - 1));
    }
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-gradient-to-br from-[#FFECE4] to-[#fce3d6] px-4 py-10 relative overflow-hidden flex flex-col justify-center">

        {/* Floating background elements */}
        <motion.div 
          animate={{ scale: [1, 1.05, 1], rotate: [0, 45, 0] }}
          transition={{ repeat: Infinity, duration: 40, ease: "linear" }}
          className="absolute -top-32 -right-32 h-[500px] w-[500px] rounded-full bg-white/40 blur-[100px]"
        />
        <motion.div 
          animate={{ x: [0, 50, 0], y: [0, 30, 0] }}
          transition={{ repeat: Infinity, duration: 30, ease: "easeInOut" }}
          className="absolute -bottom-40 -left-20 h-[600px] w-[600px] rounded-full bg-[#d4af37]/10 blur-[120px]"
        />

        <div className="mx-auto flex w-full max-w-xl flex-col gap-6 relative z-10">
          <Link to="/dashboard" className="self-start">
            <Logo className="h-7" />
          </Link>
          <div className="mb-4">
            <div className="mb-3 flex justify-between items-center text-sm font-medium text-[#181818]/60">
              <span className="bg-white/50 backdrop-blur-md rounded-full px-3 py-1 border border-white/40 shadow-sm">
                Step {stepIndex + 1} of {STEPS.length}
              </span>
            </div>
            <Progress value={((stepIndex + 1) / STEPS.length) * 100} className="h-2" />
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={step.id}
              initial={{ opacity: 0, x: 40, filter: "blur(4px)" }}
              animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, x: -40, filter: "blur(4px)" }}
              transition={{ duration: 0.35, ease: "easeInOut" }}
            >
              <MotionCard>
                <CardHeader>
                  <CardTitle className="text-2xl">{step.question}</CardTitle>
                  {step.description && <p className="text-[#181818]/60 text-sm mt-1">{step.description}</p>}
                </CardHeader>
                <CardContent className="flex flex-col gap-5">
                  {step.id === "budgetRange" && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="budgetMin">Minimum (NGN)</Label>
                        <Input
                          id="budgetMin"
                          type="number"
                          min={0}
                          {...register("budgetRange.min", { valueAsNumber: true })}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="budgetMax">Maximum (NGN)</Label>
                        <Input
                          id="budgetMax"
                          type="number"
                          min={0}
                          {...register("budgetRange.max", { valueAsNumber: true })}
                        />
                      </div>
                      {errors.budgetRange?.max && (
                        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="col-span-2 text-sm text-red-600 font-medium">{errors.budgetRange.max.message}</motion.p>
                      )}
                    </div>
                  )}

                  {step.id === "monthlyIncome" && (
                    <div className="space-y-1.5">
                      <Label htmlFor="monthlyIncome">Monthly income/contribution (NGN)</Label>
                      <Input
                        id="monthlyIncome"
                        type="number"
                        min={0}
                        {...register("monthlyIncome", { valueAsNumber: true })}
                      />
                      {errors.monthlyIncome && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm text-red-600 font-medium">{errors.monthlyIncome.message}</motion.p>}
                    </div>
                  )}

                  {step.id === "preferredArea" && (
                    <div className="space-y-1.5">
                      <Label htmlFor="preferredArea">Area you&apos;re considering</Label>
                      <Input
                        id="preferredArea"
                        type="text"
                        placeholder="e.g. Kuje, Lugbe, Guzape II"
                        {...register("preferredArea")}
                      />
                      {errors.preferredArea && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm text-red-600 font-medium">{errors.preferredArea.message}</motion.p>}
                    </div>
                  )}

                  {RADIO_OPTIONS[step.id] && (
                    <fieldset className="flex flex-col gap-2.5">
                      <legend className="sr-only">{step.question}</legend>
                      {RADIO_OPTIONS[step.id]!.map((option) => (
                        <motion.label
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                          key={option.value}
                          className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-4 text-sm font-medium transition-all duration-300 shadow-sm ${
                            selectedValue === option.value
                              ? "border-[#5C4033] bg-white text-[#5C4033] shadow-md shadow-[#5C4033]/5 ring-1 ring-[#5C4033]"
                              : "border-white/50 bg-white/50 text-[#181818]/80 hover:bg-white/80 hover:border-[#5C4033]/20"
                          }`}
                        >
                          <input
                            type="radio"
                            className="h-4 w-4 accent-[#5C4033]"
                            value={option.value}
                            checked={selectedValue === option.value}
                            onChange={() =>
                              setValue(step.id as keyof HomeReadinessAnswers, option.value as never, {
                                shouldValidate: true,
                              })
                            }
                          />
                          {option.label}
                        </motion.label>
                      ))}
                    </fieldset>
                  )}
                </CardContent>
              </MotionCard>
            </motion.div>
          </AnimatePresence>

          <div className="flex justify-between mt-4">
            <Button type="button" variant="secondary" onClick={goBack} className="w-24">
              Back
            </Button>
            <Button type="button" onClick={goNext} disabled={submitQuiz.isPending} isLoading={submitQuiz.isPending} className="min-w-28 shadow-xl shadow-[#5C4033]/15">
              {isLastStep ? "See results" : "Next"}
            </Button>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
