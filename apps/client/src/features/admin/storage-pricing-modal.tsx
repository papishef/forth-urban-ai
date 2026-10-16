import { useState } from "react";
import { motion } from "framer-motion";
import { Check, Crown, Loader2, Sparkles } from "lucide-react";
import { STORAGE_PLANS, type StoragePlanId, type StorageStatusDTO } from "@forth-urban/shared-types";
import { Badge, Button, Dialog } from "@forth-urban/ui";
import { getErrorMessage as getApiErrorMessage } from "../../lib/api-error";
import { useAdminStartStorageCheckout } from "./admin-api";

const paidPlans = STORAGE_PLANS.filter((plan) => plan.id !== "free");

export function StoragePricingModal({
  open,
  onClose,
  status,
}: {
  open: boolean;
  onClose: () => void;
  status: StorageStatusDTO | undefined;
}) {
  const [selectedPlan, setSelectedPlan] = useState<StoragePlanId | null>(null);
  const [error, setError] = useState<string | null>(null);
  const startCheckout = useAdminStartStorageCheckout();

  const handleChoosePlan = async (planId: StoragePlanId) => {
    if (planId === "free") return;
    setSelectedPlan(planId);
    setError(null);
    try {
      const checkout = await startCheckout.mutateAsync({ planId });
      window.location.assign(checkout.paymentLink);
    } catch (err) {
      setError(getApiErrorMessage(err, "Unable to start checkout. Please try again."));
      setSelectedPlan(null);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Choose your storage horizon"
      description="Keep every property story, inspection document, and market insight in one secure workspace. Plans renew monthly through Flutterwave."
      className="max-w-6xl"
    >
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#5C4033]/10 bg-white/50 px-4 py-3 text-sm text-[#181818]/70">
        <span>
          Current allowance: <strong className="text-[#181818]">{status?.planLabel ?? "Free"}</strong>
        </span>
        <span className="font-medium text-[#5C4033]">Auto-renews monthly · cancel anytime</span>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {paidPlans.map((plan, index) => {
          const isCurrent = status?.planId === plan.id;
          const isPremium = plan.isPremium;
          const isLoading = selectedPlan === plan.id && startCheckout.isPending;
          return (
            <motion.article
              key={plan.id}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08, duration: 0.3 }}
              className={`relative flex flex-col overflow-hidden rounded-3xl border p-5 shadow-sm transition sm:p-6 ${
                isPremium
                  ? "border-[#d4af37]/80 bg-gradient-to-br from-[#fffaf0] via-white to-[#FFECE4] shadow-lg shadow-[#d4af37]/20"
                  : "border-white/80 bg-white/65 hover:border-[#5C4033]/25 hover:shadow-md"
              }`}
            >
              {isPremium && (
                <div className="absolute inset-x-0 top-0 flex items-center justify-center gap-1.5 bg-gradient-to-r from-[#b8972e] via-[#e7c85c] to-[#b8972e] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-white">
                  <Crown className="h-3.5 w-3.5" /> Popular · Premium
                </div>
              )}
              <div className={isPremium ? "pt-5" : ""}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#181818]/45">{isPremium ? "Maximum headroom" : "Monthly storage"}</p>
                    <h3 className="mt-2 font-heading text-3xl font-bold text-[#181818]">{plan.label}</h3>
                  </div>
                  {isPremium ? <Sparkles className="h-5 w-5 text-[#b8972e]" /> : <Badge variant="outline">{plan.id === "starter_5gb" ? "Essential" : "Scale"}</Badge>}
                </div>
                <p className="mt-4 font-heading text-2xl font-semibold text-[#5C4033]">
                  ₦{plan.priceNaira.toLocaleString()}
                  <span className="ml-1 text-sm font-normal text-[#181818]/50">/ month</span>
                </p>
              </div>

              <ul className="mt-5 flex flex-1 flex-col gap-3 border-t border-[#181818]/10 pt-5 text-sm text-[#181818]/72">
                {[
                  `${plan.label} total workspace allowance`,
                  "Blog and property media uploads",
                  "Automatic monthly renewal",
                ].map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#FFECE4] text-[#5C4033]"><Check className="h-3 w-3" /></span>
                    {feature}
                  </li>
                ))}
              </ul>

              <Button
                type="button"
                variant={isPremium ? "primary" : "secondary"}
                disabled={isCurrent || startCheckout.isPending}
                onClick={() => void handleChoosePlan(plan.id)}
                className={`mt-6 w-full justify-center gap-2 ${isPremium ? "!bg-[#5C4033]" : ""}`}
              >
                {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                {isCurrent ? "Current plan" : isLoading ? "Opening checkout" : "Choose plan"}
              </Button>
            </motion.article>
          );
        })}
      </div>

      {error && <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{error}</p>}
      <p className="mt-5 text-center text-xs leading-relaxed text-[#181818]/50">
        Payments are processed by Flutterwave for Blue Spider Technologies Ltd. Your card details are entered on Flutterwave and never stored by this platform.
      </p>
    </Dialog>
  );
}