import * as React from "react";
import { Button, Card, CardContent, CardHeader, CardTitle, Input } from "@forth-urban/ui";
import type { UserRole, UserStatus } from "@forth-urban/shared-types";
import { useAdminUpdateUser, useAdminUsers } from "./admin-api";
import { AdminLayout } from "./admin-layout";

const ROLES: UserRole[] = ["user", "admin", "sales"];
const STATUSES: UserStatus[] = ["active", "suspended"];

export function AdminUsersPage() {
  const [page, setPage] = React.useState(1);
  const [search, setSearch] = React.useState("");
  const { data, isLoading } = useAdminUsers(page, search);
  const updateUser = useAdminUpdateUser();

  return (
    <AdminLayout title="Users">
      <div className="mb-4 flex gap-2">
        <Input
          placeholder="Search by name or email…"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{data ? `${data.total} users` : "Users"}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {isLoading && <p className="text-sm text-[#181818]/60">Loading…</p>}
          {data?.items.map((user) => (
            <div
              key={user.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#181818]/10 px-3 py-2 text-sm"
            >
              <div>
                <p className="font-medium text-[#181818]">
                  {user.firstName} {user.lastName}
                </p>
                <p className="text-[#181818]/60">{user.email}</p>
                {user.profile && (
                  <p className="text-xs text-[#5C4033]">
                    {user.profile.buyerPersona} · readiness {user.profile.readinessScore}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <select
                  className="rounded-md border border-[#181818]/20 bg-white px-2 py-1 text-sm"
                  value={user.role}
                  onChange={(e) => updateUser.mutate({ id: user.id, role: e.target.value as UserRole })}
                >
                  {ROLES.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
                <select
                  className="rounded-md border border-[#181818]/20 bg-white px-2 py-1 text-sm"
                  value={user.status}
                  onChange={(e) => updateUser.mutate({ id: user.id, status: e.target.value as UserStatus })}
                >
                  {STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>
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
