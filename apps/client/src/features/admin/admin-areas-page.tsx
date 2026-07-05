import * as React from "react";
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label } from "@forth-urban/ui";
import type { AreaPreference } from "@forth-urban/validation";
import { useAdminAreas, useAdminDeleteArea, useAdminUpsertArea } from "./admin-api";
import { AdminLayout } from "./admin-layout";

const PREFERENCE_KEYS: AreaPreference[] = [
  "premiumLiving",
  "affordableOwnership",
  "cityAccessAffordability",
  "familyOriented",
  "investmentFocused",
  "diasporaBuyer",
];

/** Drives the Best Abuja Area Quiz result instead of the hardcoded lookup — Phase 7. */
export function AdminAreasPage() {
  const { data, isLoading } = useAdminAreas();
  const upsertArea = useAdminUpsertArea();
  const deleteArea = useAdminDeleteArea();
  const [drafts, setDrafts] = React.useState<Record<string, { areaName: string; description: string }>>({});

  const areaByKey = new Map((data ?? []).map((a) => [a.preferenceKey, a]));

  return (
    <AdminLayout title="Areas">
      <Card>
        <CardHeader>
          <CardTitle>Preference → area mapping</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {isLoading && <p className="text-sm text-[#181818]/60">Loading…</p>}
          {PREFERENCE_KEYS.map((key) => {
            const existing = areaByKey.get(key);
            const draft = drafts[key] ?? {
              areaName: existing?.areaName ?? "",
              description: existing?.description ?? "",
            };
            return (
              <div key={key} className="grid grid-cols-1 items-end gap-3 rounded-lg border border-[#181818]/10 p-3 sm:grid-cols-4">
                <div className="flex flex-col gap-1.5">
                  <Label>{key}</Label>
                  <p className="text-xs text-[#181818]/50">{existing ? "Configured" : "Using built-in default"}</p>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor={`area-${key}`}>Area name</Label>
                  <Input
                    id={`area-${key}`}
                    value={draft.areaName}
                    onChange={(e) => setDrafts((prev) => ({ ...prev, [key]: { ...draft, areaName: e.target.value } }))}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor={`desc-${key}`}>Description</Label>
                  <Input
                    id={`desc-${key}`}
                    value={draft.description}
                    onChange={(e) =>
                      setDrafts((prev) => ({ ...prev, [key]: { ...draft, description: e.target.value } }))
                    }
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    disabled={!draft.areaName}
                    onClick={() =>
                      upsertArea.mutate({ preferenceKey: key, areaName: draft.areaName, description: draft.description })
                    }
                  >
                    Save
                  </Button>
                  {existing && (
                    <Button variant="secondary" onClick={() => deleteArea.mutate(existing.id)}>
                      Reset
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </AdminLayout>
  );
}
