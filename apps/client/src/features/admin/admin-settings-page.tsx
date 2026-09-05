import * as React from "react";
import { Button, BuildingLoader, Card, CardContent, CardHeader, CardTitle, Input, Label, StorageMeter } from "@forth-urban/ui";
import { useAdminSetStorageAutoRenew, useAdminSettings, useAdminStorageStatus, useAdminUpdateSettings } from "./admin-api";
import { AdminLayout } from "./admin-layout";
import { canWriteAdminMenu } from "../../lib/admin-access";
import { useAuth } from "../../lib/auth-context";
import { getErrorMessage } from "../../lib/api-error";
import { StoragePricingModal } from "./storage-pricing-modal";

/**
 * Short, human-readable explanations shown under each setting's label —
 * what it controls, which direction raising/lowering it pushes outcomes,
 * and why the shipped default was chosen. Purely descriptive UI copy; the
 * Decision Engine remains the single source of truth for the numbers.
 */
const WEIGHT_DESCRIPTIONS: Record<string, string> = {
  budget:
    "How much a property's price-fit counts toward its match score. It's the largest weight by default (40) because affordability is the #1 reason buyers drop off — raising it favors budget fit over location/lifestyle; lowering it lets other factors compete more.",
  area: "How much matching the buyer's preferred area/landmarks counts. Raise it to prioritize location over price; lower it if budget fit should dominate recommendations instead.",
  buyerGoal:
    "How much matching the buyer's goal (investment, residential, family, etc.) to a property's best-fit buyer types counts. Higher values surface properties built for that goal more aggressively.",
  paymentStyle:
    "How much matching the buyer's preferred payment style (one-time vs. installment) counts. Kept modest by default since most properties support both.",
  lifestyle:
    "How much matching lifestyle preference (e.g. premium/quiet, city access) to a property's area counts. It's the smallest weight by default (5) — the softest, least decisive signal.",
};

const ROI_DESCRIPTIONS: Record<string, string> = {
  conservative:
    "Annual appreciation rate assumed for the cautious ROI projection. Lower is safer and more credible to skeptical buyers; raising it makes projected returns look better but harder to defend if the market underperforms.",
  moderate:
    "Annual appreciation rate for the realistic, most-likely scenario — the number most buyers anchor on. Keep it close to observed market trends for the area.",
  optimistic:
    "Annual appreciation rate for the best-case scenario. Useful for showing upside, but inflating it risks setting expectations the market can't meet — keep it ambitious yet believable.",
};

function SettingDescription({ text }: { text: string }) {
  return <p className="text-xs leading-snug text-[#181818]/45">{text}</p>;
}

/** Local editable copy of the two settings groups. Mounted only once initial data is available, and
 *  keyed by nothing else changing — local state is intentionally the single source of truth after that
 *  (avoids syncing query data into state via an effect). */
function SettingsForm({
  initialWeights,
  initialRoi,
  canWrite,
}: {
  initialWeights: Record<string, number>;
  initialRoi: Record<string, number>;
  canWrite: boolean;
}) {
  const updateSettings = useAdminUpdateSettings();
  const [weights, setWeights] = React.useState(initialWeights);
  const [roi, setRoi] = React.useState(initialRoi);

  const onSave = async () => {
    await updateSettings.mutateAsync({
      propertyMatchWeights: weights as never,
      roiAssumptionDefaults: roi as never,
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Property matching weights</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {Object.entries(weights).map(([key, value]) => (
            <div key={key} className="flex flex-col gap-1.5">
              <Label htmlFor={`weight-${key}`}>{key}</Label>
              {WEIGHT_DESCRIPTIONS[key] && <SettingDescription text={WEIGHT_DESCRIPTIONS[key]} />}
              <Input
                id={`weight-${key}`}
                type="number"
                value={value}
                disabled={!canWrite}
                onChange={(e) => setWeights((prev) => ({ ...prev, [key]: Number(e.target.value) }))}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>ROI assumption defaults</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {Object.entries(roi).map(([key, value]) => (
            <div key={key} className="flex flex-col gap-1.5">
              <Label htmlFor={`roi-${key}`}>{key}</Label>
              {ROI_DESCRIPTIONS[key] && <SettingDescription text={ROI_DESCRIPTIONS[key]} />}
              <Input
                id={`roi-${key}`}
                type="number"
                step="0.01"
                value={value}
                disabled={!canWrite}
                onChange={(e) => setRoi((prev) => ({ ...prev, [key]: Number(e.target.value) }))}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={onSave} disabled={!canWrite || updateSettings.isPending}>
          {updateSettings.isPending ? "Saving…" : "Save settings"}
        </Button>
      </div>
    </div>
  );
}

/** ROI assumption defaults + property-matching rule weights editor — Decision Engine consumes these directly, no redeploy needed. */
export function AdminSettingsPage() {
  const { data, isLoading } = useAdminSettings();
  const storage = useAdminStorageStatus();
  const { user } = useAuth();
  const canWrite = canWriteAdminMenu(user, "settings");
  const [showPricing, setShowPricing] = React.useState(false);

  return (
    <AdminLayout title="Settings">
      {isLoading || !data ? (
        <BuildingLoader size="md" label="Loading settings…" className="py-16" />
      ) : (
        <>
          {storage.data ? (
            <StorageSettingsCard
              status={storage.data}
              canWrite={canWrite}
              onUpgrade={() => setShowPricing(true)}
            />
          ) : storage.isLoading ? (
            <Card className="mb-6"><CardContent className="py-6"><BuildingLoader size="sm" label="Loading storage allowance…" /></CardContent></Card>
          ) : (
            <Card className="mb-6 border-amber-200 bg-amber-50/60"><CardContent className="py-4 text-sm text-amber-800">Storage status is temporarily unavailable.</CardContent></Card>
          )}
          <SettingsForm
            initialWeights={data.propertyMatchWeights as Record<string, number>}
            initialRoi={data.roiAssumptionDefaults as unknown as Record<string, number>}
            canWrite={canWrite}
          />
        </>
      )}
      <StoragePricingModal open={showPricing} onClose={() => setShowPricing(false)} status={storage.data} />
    </AdminLayout>
  );
}

function StorageSettingsCard({
  status,
  canWrite,
  onUpgrade,
}: {
  status: NonNullable<ReturnType<typeof useAdminStorageStatus>["data"]>;
  canWrite: boolean;
  onUpgrade: () => void;
}) {
  const setAutoRenew = useAdminSetStorageAutoRenew();
  const [error, setError] = React.useState<string | null>(null);

  const cancelRenewal = async () => {
    if (!window.confirm("Cancel automatic renewal? Your current paid allowance remains available until the end of its billing period.")) return;
    setError(null);
    try {
      await setAutoRenew.mutateAsync(false);
    } catch (err) {
      setError(getErrorMessage(err, "Automatic renewal could not be changed."));
    }
  };

  return (
    <Card className="mb-6 overflow-hidden border-[#5C4033]/15 bg-gradient-to-br from-white/80 via-white/55 to-[#FFECE4]/70 shadow-md shadow-[#5C4033]/10">
      <CardHeader className="flex flex-col gap-3 border-b border-[#181818]/10 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <CardTitle>Workspace storage</CardTitle>
          <p className="mt-1 max-w-xl text-sm leading-relaxed text-[#181818]/60">One shared allowance for your blog covers and property media. Existing files stay available when you reach the limit; new uploads pause until space is available.</p>
        </div>
        {status.planId !== "free" && <span className="rounded-full border border-[#d4af37]/40 bg-[#fff8df] px-3 py-1 text-xs font-semibold text-[#8b6e18]">{status.planLabel} plan</span>}
      </CardHeader>
      <CardContent className="space-y-4 pt-5">
        <StorageMeter status={status} onUpgrade={canWrite ? onUpgrade : undefined} />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-[#181818]/55">
            {status.planId === "free" ? "You have 50 MB included at no cost." : status.autoRenew ? "Your paid plan renews automatically through Flutterwave." : "Automatic renewal is off; your paid allowance ends with this billing period."}
          </p>
          {canWrite && status.planId !== "free" && status.autoRenew && (
            <Button type="button" variant="ghost" size="sm" onClick={() => void cancelRenewal()} disabled={setAutoRenew.isPending}>
              {setAutoRenew.isPending ? "Updating…" : "Cancel auto-renew"}
            </Button>
          )}
        </div>
        {error && <p className="text-sm font-medium text-red-700">{error}</p>}
      </CardContent>
    </Card>
  );
}
