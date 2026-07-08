import * as React from "react";
import { Button, BuildingLoader, Card, CardContent, CardHeader, CardTitle } from "@forth-urban/ui";
import type { PipelineStage } from "@forth-urban/shared-types";
import { useAdminCrmBoard, useAdminUpdateCrmEvent } from "./admin-api";
import { AdminLayout } from "./admin-layout";

const STAGES: PipelineStage[] = [
  "new",
  "contacted",
  "qualified",
  "inspectionScheduled",
  "inspectionCompleted",
  "won",
  "lost",
];

/** Lightweight CRM board (Phase 7) — a lead's "column" is simply their latest event's pipelineStage. */
export function AdminCrmPage() {
  const { data, isLoading } = useAdminCrmBoard();
  const updateEvent = useAdminUpdateCrmEvent();
  const [noteDrafts, setNoteDrafts] = React.useState<Record<string, string>>({});

  return (
    <AdminLayout title="CRM">
      {isLoading && <BuildingLoader size="sm" label="Loading…" className="py-6" />}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {STAGES.map((stage) => {
          const leads = data?.filter((lead) => lead.pipelineStage === stage) ?? [];
          return (
            <Card key={stage}>
              <CardHeader>
                <CardTitle className="text-base">
                  {stage} ({leads.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                {leads.map((lead) => (
                  <div key={lead.id} className="rounded-lg border border-[#181818]/10 p-3 text-sm">
                    <p className="font-medium text-[#181818]">
                      {lead.user ? `${lead.user.firstName} ${lead.user.lastName}` : "Unknown lead"}
                    </p>
                    <p className="mb-2 text-xs text-[#181818]/60">{lead.user?.email}</p>
                    {lead.tags.length > 0 && (
                      <p className="mb-2 text-xs text-[#5C4033]">{lead.tags.join(", ")}</p>
                    )}
                    <div className="flex flex-col gap-2">
                      <select
                        className="rounded-md border border-[#181818]/20 bg-white px-2 py-1 text-xs"
                        value={lead.pipelineStage}
                        onChange={(e) =>
                          updateEvent.mutate({
                            userId: lead.userId,
                            input: { pipelineStage: e.target.value as PipelineStage },
                          })
                        }
                      >
                        {STAGES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                      <div className="flex gap-2">
                        <input
                          className="min-w-0 flex-1 rounded-md border border-[#181818]/20 px-2 py-1 text-xs"
                          placeholder="Add a note…"
                          value={noteDrafts[lead.userId] ?? ""}
                          onChange={(e) => setNoteDrafts((prev) => ({ ...prev, [lead.userId]: e.target.value }))}
                        />
                        <Button
                          variant="secondary"
                          className="px-2 py-1 text-xs"
                          disabled={!noteDrafts[lead.userId]}
                          onClick={() => {
                            updateEvent.mutate({ userId: lead.userId, input: { addNote: noteDrafts[lead.userId] } });
                            setNoteDrafts((prev) => ({ ...prev, [lead.userId]: "" }));
                          }}
                        >
                          Add
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </AdminLayout>
  );
}
