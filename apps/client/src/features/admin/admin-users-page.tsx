import * as React from "react";
import { AnimatePresence } from "framer-motion";
import { ShieldCheck, ShieldOff } from "lucide-react";
import { Button, BuildingLoader, Card, CardContent, CardHeader, CardTitle, Input } from "@forth-urban/ui";
import type { UserRole, UserStatus } from "@forth-urban/shared-types";
import { useAuth } from "../../lib/auth-context";
import { useAdminUpdateUser, useAdminUsers, useVerifyPassword } from "./admin-api";
import { AdminLayout } from "./admin-layout";
import { PasswordConfirmModal } from "./password-confirm-modal";

const ROLES: UserRole[] = ["user", "admin", "sales"];
const STATUSES: UserStatus[] = ["active", "suspended"];

interface PendingChange {
  userId: string;
  userName: string;
  field: "role" | "status";
  previousValue: string;
  nextValue: string;
}

export function AdminUsersPage() {
  const [page, setPage] = React.useState(1);
  const [search, setSearch] = React.useState("");
  const { data, isLoading } = useAdminUsers(page, search);
  const updateUser = useAdminUpdateUser();
  const verifyPassword = useVerifyPassword();
  const { user: currentUser } = useAuth();
  const isAdmin = currentUser?.role === "admin";
  const [pendingChange, setPendingChange] = React.useState<PendingChange | null>(null);

  async function handleConfirmChange(password: string) {
    if (!pendingChange) return;
    await verifyPassword.mutateAsync(password);
    await updateUser.mutateAsync({
      id: pendingChange.userId,
      [pendingChange.field]: pendingChange.nextValue,
    } as { id: string; role?: UserRole; status?: UserStatus });
    setPendingChange(null);
  }

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
          {isLoading && <BuildingLoader size="sm" label="Loading…" className="py-6" />}
          {data?.items.map((user) => {
            const userName = `${user.firstName} ${user.lastName}`.trim();
            return (
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
                {isAdmin ? (
                  <div className="flex items-center gap-2">
                    <select
                      className="rounded-md border border-[#181818]/20 bg-white px-2 py-1 text-sm"
                      value={user.role}
                      onChange={(e) =>
                        setPendingChange({
                          userId: user.id,
                          userName,
                          field: "role",
                          previousValue: user.role,
                          nextValue: e.target.value,
                        })
                      }
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
                      onChange={(e) =>
                        setPendingChange({
                          userId: user.id,
                          userName,
                          field: "status",
                          previousValue: user.status,
                          nextValue: e.target.value,
                        })
                      }
                    >
                      {STATUSES.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="flex items-center gap-2" title="Only admins can change role or status">
                    <span className="inline-flex items-center gap-1 rounded-full border border-[#181818]/10 bg-[#181818]/5 px-2.5 py-1 text-xs font-medium capitalize text-[#181818]/70">
                      {user.role}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium capitalize ${
                        user.status === "active" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {user.status === "active" ? (
                        <ShieldCheck className="h-3 w-3" />
                      ) : (
                        <ShieldOff className="h-3 w-3" />
                      )}
                      {user.status}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
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

      <AnimatePresence>
        {pendingChange && (
          <PasswordConfirmModal
            title="Confirm this change"
            confirmLabel="Confirm change"
            description={
              <>
                You&apos;re changing <span className="font-medium text-[#181818]">{pendingChange.userName}</span>
                &apos;s {pendingChange.field === "role" ? "role" : "status"} from{" "}
                <span className="font-medium text-[#5C4033]">{pendingChange.previousValue}</span> to{" "}
                <span className="font-medium text-[#5C4033]">{pendingChange.nextValue}</span>. Enter your password to
                confirm.
              </>
            }
            onCancel={() => setPendingChange(null)}
            onConfirm={handleConfirmChange}
          />
        )}
      </AnimatePresence>
    </AdminLayout>
  );
}

