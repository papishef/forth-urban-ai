import * as React from "react";
import { Button, Card, CardContent, CardHeader, CardTitle, Input } from "@forth-urban/ui";
import { useAdminLogs } from "./admin-api";
import { AdminLayout } from "./admin-layout";

export function AdminLogsPage() {
  const [page, setPage] = React.useState(1);
  const [action, setAction] = React.useState("");
  const { data, isLoading } = useAdminLogs(page, action);

  return (
    <AdminLayout title="System / Audit Logs">
      <div className="mb-4 flex gap-2">
        <Input
          placeholder="Filter by action (e.g. quiz.completed)…"
          value={action}
          onChange={(e) => {
            setAction(e.target.value);
            setPage(1);
          }}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{data ? `${data.total} entries` : "Audit logs"}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {isLoading && <p className="text-sm text-[#181818]/60">Loading…</p>}
          {data?.items.map((log) => (
            <div key={log.id} className="rounded-lg border border-[#181818]/10 px-3 py-2 text-sm">
              <p className="font-medium text-[#181818]">
                {log.action} <span className="text-xs text-[#181818]/50">({log.actorType})</span>
              </p>
              <p className="text-xs text-[#181818]/50">
                {new Date(log.createdAt).toLocaleString()}
                {log.targetType ? ` · ${log.targetType}` : ""}
              </p>
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
