import * as React from "react";
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label } from "@forth-urban/ui";
import { useAdminSettings, useAdminUpdateSettings } from "./admin-api";
import { AdminLayout } from "./admin-layout";

/** Local editable copy of the two settings groups. Mounted only once initial data is available, and
 *  keyed by nothing else changing — local state is intentionally the single source of truth after that
 *  (avoids syncing query data into state via an effect). */
function SettingsForm({
  initialWeights,
  initialRoi,
}: {
  initialWeights: Record<string, number>;
  initialRoi: Record<string, number>;
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
        <CardContent className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {Object.entries(weights).map(([key, value]) => (
            <div key={key} className="flex flex-col gap-1.5">
              <Label htmlFor={`weight-${key}`}>{key}</Label>
              <Input
                id={`weight-${key}`}
                type="number"
                value={value}
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
        <CardContent className="grid grid-cols-3 gap-4">
          {Object.entries(roi).map(([key, value]) => (
            <div key={key} className="flex flex-col gap-1.5">
              <Label htmlFor={`roi-${key}`}>{key}</Label>
              <Input
                id={`roi-${key}`}
                type="number"
                step="0.01"
                value={value}
                onChange={(e) => setRoi((prev) => ({ ...prev, [key]: Number(e.target.value) }))}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={onSave} disabled={updateSettings.isPending}>
          {updateSettings.isPending ? "Saving…" : "Save settings"}
        </Button>
      </div>
    </div>
  );
}

/** ROI assumption defaults + property-matching rule weights editor — Decision Engine consumes these directly, no redeploy needed. */
export function AdminSettingsPage() {
  const { data, isLoading } = useAdminSettings();

  return (
    <AdminLayout title="Settings">
      {isLoading || !data ? (
        <p className="text-sm text-[#181818]/60">Loading…</p>
      ) : (
        <SettingsForm
          initialWeights={data.propertyMatchWeights as Record<string, number>}
          initialRoi={data.roiAssumptionDefaults as unknown as Record<string, number>}
        />
      )}
    </AdminLayout>
  );
}
