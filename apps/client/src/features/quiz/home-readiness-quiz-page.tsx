import * as React from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion } from "framer-motion";
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label, Progress } from "@forth-urban/ui";
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
  fields: Array<keyof HomeReadinessAnswers>;
}

const STEPS: Step[] = [
  { id: "buyerGoal", question: "Why do you want land?", fields: ["buyerGoal"] },
  { id: "budgetRange", question: "What can you start with?", fields: ["budgetRange"] },
  { id: "monthlyIncome", question: "What payment pressure can you handle?", fields: ["monthlyIncome"] },
  { id: "paymentStyle", question: "One-time or installment?", fields: ["paymentStyle"] },
  { id: "timeline", question: "When do you want to buy?", fields: ["timeline"] },
  { id: "preferredArea", question: "Where are you considering?", fields: ["preferredArea"] },
  { id: "lifestylePreference", question: "What environment fits you?", fields: ["lifestylePreference"] },
  { id: "biggestFear", question: "What is stopping you?", fields: ["biggestFear"] },
  { id: "inspectionPreference", question: "How would you like to verify the land?", fields: ["inspectionPreference"] },
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
    setStepIndex((i) => Math.max(0, i - 1));
  }

  return (
    <div className="min-h-screen bg-[#FFECE4] px-4 py-10">
      <div className="mx-auto flex max-w-xl flex-col gap-6">
        <div>
          <p className="mb-2 text-sm font-medium text-[#181818]/60">
            Step {stepIndex + 1} of {STEPS.length}
          </p>
          <Progress value={((stepIndex + 1) / STEPS.length) * 100} />
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step.id}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.2 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>{step.question}</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                {step.id === "budgetRange" && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="budgetMin">Minimum (NGN)</Label>
                      <Input
                        id="budgetMin"
                        type="number"
                        min={0}
                        {...register("budgetRange.min", { valueAsNumber: true })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="budgetMax">Maximum (NGN)</Label>
                      <Input
                        id="budgetMax"
                        type="number"
                        min={0}
                        {...register("budgetRange.max", { valueAsNumber: true })}
                      />
                    </div>
                    {errors.budgetRange?.max && (
                      <p className="col-span-2 text-sm text-red-600">{errors.budgetRange.max.message}</p>
                    )}
                  </div>
                )}

                {step.id === "monthlyIncome" && (
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
                )}

                {step.id === "preferredArea" && (
                  <div>
                    <Label htmlFor="preferredArea">Area you&apos;re considering</Label>
                    <Input
                      id="preferredArea"
                      type="text"
                      placeholder="e.g. Kuje, Lugbe, Guzape II"
                      {...register("preferredArea")}
                    />
                    {errors.preferredArea && <p className="text-sm text-red-600">{errors.preferredArea.message}</p>}
                  </div>
                )}

                {RADIO_OPTIONS[step.id] && (
                  <fieldset className="flex flex-col gap-2">
                    <legend className="sr-only">{step.question}</legend>
                    {RADIO_OPTIONS[step.id]!.map((option) => (
                      <label
                        key={option.value}
                        className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm transition-colors ${
                          selectedValue === option.value
                            ? "border-[#5C4033] bg-[#FFECE4]"
                            : "border-[#5C4033]/15 bg-white hover:bg-[#FFECE4]/60"
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
                      </label>
                    ))}
                  </fieldset>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>

        <div className="flex justify-between">
          <Button type="button" variant="secondary" onClick={goBack} disabled={stepIndex === 0}>
            Back
          </Button>
          <Button type="button" onClick={goNext} disabled={submitQuiz.isPending}>
            {isLastStep ? (submitQuiz.isPending ? "Submitting…" : "See my result") : "Next"}
          </Button>
        </div>
      </div>
    </div>
  );
}
