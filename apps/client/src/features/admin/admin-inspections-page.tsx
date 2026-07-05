import * as React from "react";
import { Button, Card, CardContent, CardHeader, CardTitle } from "@forth-urban/ui";
import type { InspectionBookingStatus } from "@forth-urban/shared-types";
import { useAdminInspections, useAdminUpdateInspection } from "./admin-api";
import { AdminLayout } from "./admin-layout";

const STATUSES: InspectionBookingStatus[] = ["pending", "confirmed", "completed", "cancelled"];

export function AdminInspectionsPage() {
  const [page, setPage] = React.useState(1);
  const [status, setStatus] = React.useState("");
  const { data, isLoading } = useAdminInspections(page, status);
  const updateInspection = useAdminUpdateInspection();

  return (
    <AdminLayout title="Inspections">
      <div className="mb-4 flex gap-2">
        <select
          className="rounded-md border border-[#181818]/20 bg-white px-3 py-2 text-sm"
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{data ? `${data.total} bookings` : "Bookings"}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {isLoading && <p className="text-sm text-[#181818]/60">Loading…</p>}
          {data?.items.map((booking) => (
            <div
              key={booking.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#181818]/10 px-3 py-2 text-sm"
            >
              <div>
                <p className="font-medium text-[#181818]">
                  {booking.user.firstName} {booking.user.lastName} — {booking.user.email}
                </p>
                <p className="text-[#181818]/60">
                  {booking.propertyName ?? booking.recommendedArea ?? "—"} · {booking.preferredDate} at{" "}
                  {booking.preferredTime} · {booking.inspectionType}
                </p>
              </div>
              <select
                className="rounded-md border border-[#181818]/20 bg-white px-2 py-1 text-sm"
                value={booking.status}
                onChange={(e) =>
                  updateInspection.mutate({
                    id: booking.id,
                    input: { status: e.target.value as InspectionBookingStatus },
                  })
                }
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </CardContent>
      </Card>

      {data && (
        <div className="mt-4 flex items-center gap-2">
          <Button variant="secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            Previous
          </Button>
          <span className="text-sm text-[#181818]/60">
            Page {data.page} of {Math.max(1, Math.ceil(data.total / data.limit))}
          </span>
          <Button
            variant="secondary"
            disabled={page * data.limit >= data.total}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </AdminLayout>
  );
}
