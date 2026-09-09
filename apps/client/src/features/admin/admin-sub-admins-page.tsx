import * as React from "react";
import { AnimatePresence } from "framer-motion";
import { Check, Edit3, Search, ShieldCheck, ShieldOff, Trash2, UserPlus } from "lucide-react";
import type { AdminMenuKey, AdminMenuPermissionsDTO, AdminUserDTO } from "@forth-urban/shared-types";
import { ADMIN_MENU_KEYS, READ_ONLY_ADMIN_MENU_KEYS } from "@forth-urban/shared-types";
import { Button, BuildingLoader, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Label } from "@forth-urban/ui";
import { getErrorMessage } from "../../lib/api-error";
import {
  useAdminCreateSubAdmin,
  useAdminRemoveSubAdmin,
  useAdminSubAdminCandidates,
  useAdminSubAdmins,
  useAdminUpdateSubAdmin,
  useVerifyPassword,
} from "./admin-api";
import { AdminLayout } from "./admin-layout";
import { PasswordConfirmModal } from "./password-confirm-modal";

const MENU_LABELS: Record<AdminMenuKey, string> = {
  inspections: "Inspections",
  crm: "CRM",
  "contact-messages": "Inquiries",
  users: "Users",
  properties: "Properties",
  attendance: "Attendance",
  blog: "Blog articles",
  newsletter: "Newsletter",
  "email-campaigns": "Email campaigns",
  analytics: "Analytics",
  settings: "Settings",
  areas: "Areas",
  prompts: "Prompts",
  logs: "Audit logs",
  kiosk: "Kiosk access",
};

type PendingAction =
  | { kind: "save"; userId: string | null; title: string; permissions: AdminMenuPermissionsDTO }
  | { kind: "status"; userId: string; status: "active" | "suspended" }
  | { kind: "remove"; userId: string };

function emptyPermissions(): AdminMenuPermissionsDTO {
  return {};
}

function copyPermissions(source: AdminMenuPermissionsDTO | undefined): AdminMenuPermissionsDTO {
  return Object.fromEntries(
    ADMIN_MENU_KEYS.map((menu) => {
      const permission = source?.[menu];
      return [menu, { read: Boolean(permission?.read), write: Boolean(permission?.write) }];
    }),
  );
}

function PermissionMatrix({
  permissions,
  onChange,
}: {
  permissions: AdminMenuPermissionsDTO;
  onChange: (permissions: AdminMenuPermissionsDTO) => void;
}) {
  function setPermission(menu: AdminMenuKey, next: { read: boolean; write: boolean }) {
    onChange({ ...permissions, [menu]: next });
  }

  return (
    <div className="flex flex-col gap-2">
      {ADMIN_MENU_KEYS.map((menu) => {
        const permission = permissions[menu] ?? { read: false, write: false };
        const readOnly = READ_ONLY_ADMIN_MENU_KEYS.includes(menu as (typeof READ_ONLY_ADMIN_MENU_KEYS)[number]);
        return (
          <div key={menu} className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-3 rounded-lg border border-[#181818]/10 bg-white px-3 py-2.5">
            <span className="text-sm font-medium text-[#181818]">{MENU_LABELS[menu]}</span>
            <label className="flex items-center gap-1.5 text-xs text-[#181818]/70">
              <input
                type="checkbox"
                checked={permission.read}
                aria-label={`${MENU_LABELS[menu]} read access`}
                onChange={(event) => setPermission(menu, { read: event.target.checked, write: event.target.checked && permission.write })}
              />
              Read
            </label>
            <label className="flex items-center gap-1.5 text-xs text-[#181818]/70">
              <input
                type="checkbox"
                checked={permission.write}
                disabled={readOnly || !permission.read}
                aria-label={`${MENU_LABELS[menu]} write access`}
                onChange={(event) => setPermission(menu, { read: permission.read || event.target.checked, write: event.target.checked })}
              />
              {readOnly ? "Read-only" : "Write"}
            </label>
          </div>
        );
      })}
    </div>
  );
}

function accessSummary(user: AdminUserDTO): string {
  const permissions = user.adminAccess?.permissions ?? {};
  return ADMIN_MENU_KEYS.filter((menu) => permissions[menu]?.read || permissions[menu]?.write)
    .map((menu) => MENU_LABELS[menu])
    .join(", ");
}

function candidateLabel(user: AdminUserDTO): string {
  return `${user.firstName} ${user.lastName} · ${user.email}`;
}

function ExistingUserCombobox({
  candidates,
  isLoading,
  selectedUserId,
  query,
  onQueryChange,
  onSelect,
}: {
  candidates: AdminUserDTO[] | undefined;
  isLoading: boolean;
  selectedUserId: string;
  query: string;
  onQueryChange: (query: string) => void;
  onSelect: (user: AdminUserDTO) => void;
}) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = React.useState(false);
  const normalizedQuery = query.trim().toLowerCase();
  const filteredCandidates = (candidates ?? []).filter((user) =>
    `${user.firstName} ${user.lastName} ${user.email}`.toLowerCase().includes(normalizedQuery),
  );

  React.useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setIsOpen(false);
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      setIsOpen(false);
      return;
    }
    if (event.key === "ArrowDown") {
      setIsOpen(true);
      return;
    }
    if (event.key === "Enter" && isOpen && filteredCandidates.length === 1) {
      event.preventDefault();
      onSelect(filteredCandidates[0]!);
      setIsOpen(false);
    }
  }

  return (
    <div ref={containerRef} className="flex flex-col gap-1.5">
      <Label htmlFor="sub-admin-user-search">Existing user</Label>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-[#181818]/45" />
        <Input
          id="sub-admin-user-search"
          value={query}
          onChange={(event) => {
            onQueryChange(event.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={isLoading ? "Loading users…" : "Search by name or email"}
          autoComplete="off"
          role="combobox"
          aria-expanded={isOpen}
          aria-controls="sub-admin-user-options"
          aria-autocomplete="list"
          disabled={isLoading}
          className="pl-10"
        />
        {isOpen && !isLoading && (
          <div
            id="sub-admin-user-options"
            role="listbox"
            className="absolute inset-x-0 top-full z-20 mt-1 max-h-60 overflow-y-auto rounded-xl border border-[#181818]/15 bg-white p-1 shadow-lg"
          >
            {filteredCandidates.length > 0 ? (
              filteredCandidates.map((user) => (
                <button
                  key={user.id}
                  type="button"
                  role="option"
                  aria-selected={user.id === selectedUserId}
                  onClick={() => {
                    onSelect(user);
                    setIsOpen(false);
                  }}
                  className="flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm text-[#181818] hover:bg-[#FFECE4] focus:bg-[#FFECE4] focus:outline-none"
                >
                  <span className="min-w-0 truncate">
                    <span className="font-medium">{user.firstName} {user.lastName}</span>
                    <span className="ml-2 text-[#181818]/55">{user.email}</span>
                  </span>
                  {user.id === selectedUserId && <Check className="h-4 w-4 shrink-0 text-[#5C4033]" />}
                </button>
              ))
            ) : (
              <p className="px-3 py-2 text-sm text-[#181818]/60">No matching users.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export function AdminSubAdminsPage() {
  const { data: subAdmins, isLoading: subAdminsLoading } = useAdminSubAdmins();
  const { data: candidates, isLoading: candidatesLoading } = useAdminSubAdminCandidates();
  const createSubAdmin = useAdminCreateSubAdmin();
  const updateSubAdmin = useAdminUpdateSubAdmin();
  const removeSubAdmin = useAdminRemoveSubAdmin();
  const verifyPassword = useVerifyPassword();
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = React.useState("");
  const [candidateSearch, setCandidateSearch] = React.useState("");
  const [title, setTitle] = React.useState("");
  const [permissions, setPermissions] = React.useState<AdminMenuPermissionsDTO>(emptyPermissions);
  const [pendingAction, setPendingAction] = React.useState<PendingAction | null>(null);
  const [formError, setFormError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);

  function startCreate() {
    setEditingId(null);
    setSelectedUserId("");
    setCandidateSearch("");
    setTitle("");
    setPermissions(emptyPermissions());
    setFormError(null);
    setSuccess(null);
  }

  function startEdit(user: AdminUserDTO) {
    setEditingId(user.id);
    setSelectedUserId(user.id);
    setCandidateSearch(candidateLabel(user));
    setTitle(user.adminAccess?.title ?? "");
    setPermissions(copyPermissions(user.adminAccess?.permissions));
    setFormError(null);
    setSuccess(null);
  }

  function requestSave(event: React.FormEvent) {
    event.preventDefault();
    setFormError(null);
    if (!editingId && !selectedUserId) {
      setFormError("Select an existing user first.");
      return;
    }
    if (!title.trim()) {
      setFormError("Add a title for this access profile.");
      return;
    }
    if (!Object.values(permissions).some((permission) => permission?.read || permission?.write)) {
      setFormError("Grant at least one readable menu.");
      return;
    }
    setPendingAction({ kind: "save", userId: editingId ?? selectedUserId, title: title.trim(), permissions });
  }

  async function confirmAction(password: string) {
    if (!pendingAction) return;
    const { reauthToken } = await verifyPassword.mutateAsync(password);
    const wasEditing = Boolean(editingId);

    if (pendingAction.kind === "save") {
      if (pendingAction.userId && editingId) {
        await updateSubAdmin.mutateAsync({
          id: pendingAction.userId,
          input: { title: pendingAction.title, permissions: pendingAction.permissions },
          reauthToken,
        });
      } else {
        await createSubAdmin.mutateAsync({
          input: {
            userId: pendingAction.userId!,
            title: pendingAction.title,
            permissions: pendingAction.permissions,
          },
          reauthToken,
        });
      }
      startCreate();
      setSuccess(wasEditing ? "Sub-admin access updated." : "Sub-admin access granted.");
    } else if (pendingAction.kind === "status") {
      await updateSubAdmin.mutateAsync({ id: pendingAction.userId, input: { status: pendingAction.status }, reauthToken });
      setSuccess(pendingAction.status === "active" ? "Sub-admin reactivated." : "Sub-admin suspended.");
    } else {
      await removeSubAdmin.mutateAsync({ id: pendingAction.userId, reauthToken });
      startCreate();
      setSuccess("Sub-admin access removed.");
    }
    setPendingAction(null);
  }

  const editingUser = subAdmins?.find((user) => user.id === editingId);

  return (
    <AdminLayout title="Team & access">
      <div className="flex flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle>{editingUser ? "Edit access profile" : "Create a sub-admin"}</CardTitle>
            <CardDescription>
              Convert an existing user into a named operational account. Their regular customer dashboard will be replaced by the menus you grant here.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="flex flex-col gap-5" onSubmit={requestSave} noValidate>
              {!editingUser && (
                <ExistingUserCombobox
                  candidates={candidates}
                  isLoading={candidatesLoading}
                  selectedUserId={selectedUserId}
                  query={candidateSearch}
                  onQueryChange={(value) => {
                    setCandidateSearch(value);
                    setSelectedUserId("");
                  }}
                  onSelect={(user) => {
                    setSelectedUserId(user.id);
                    setCandidateSearch(candidateLabel(user));
                  }}
                />
              )}
              {editingUser && (
                <div className="rounded-lg bg-[#FFECE4] px-3 py-2 text-sm text-[#181818]/75">
                  Editing <span className="font-medium text-[#181818]">{editingUser.firstName} {editingUser.lastName}</span> · {editingUser.email}
                </div>
              )}
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="sub-admin-title">Custom title</Label>
                <Input id="sub-admin-title" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="e.g. Property Manager" maxLength={80} />
              </div>
              <div className="flex flex-col gap-2">
                <div>
                  <p className="text-sm font-medium text-[#181818]">Menu access</p>
                  <p className="text-xs text-[#181818]/55">Write access automatically includes read access. Some menus are read-only by design.</p>
                </div>
                <PermissionMatrix permissions={permissions} onChange={setPermissions} />
              </div>
              {formError && <p className="text-sm text-red-600">{formError}</p>}
              {success && <p className="text-sm text-green-700">{success}</p>}
              {createSubAdmin.isError && <p className="text-sm text-red-600">{getErrorMessage(createSubAdmin.error, "Could not create sub-admin access")}</p>}
              {updateSubAdmin.isError && <p className="text-sm text-red-600">{getErrorMessage(updateSubAdmin.error, "Could not update sub-admin access")}</p>}
              <div className="flex flex-wrap justify-end gap-2">
                {editingUser && <Button type="button" variant="secondary" onClick={startCreate}>Cancel edit</Button>}
                <Button type="submit" disabled={createSubAdmin.isPending || updateSubAdmin.isPending}>
                  <UserPlus className="h-4 w-4" />
                  {editingUser ? "Save access" : "Grant access"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Current sub-admins</CardTitle>
            <CardDescription>Access changes take effect on the next request and suspended accounts cannot sign in.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {subAdminsLoading && <BuildingLoader size="sm" label="Loading team…" className="py-6" />}
            {!subAdminsLoading && !subAdmins?.length && <p className="text-sm text-[#181818]/60">No sub-admin access profiles yet.</p>}
            {subAdmins?.map((user) => (
              <div key={user.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#181818]/10 px-3 py-3">
                <div className="min-w-0">
                  <p className="font-medium text-[#181818]">{user.adminAccess?.title ?? "Untitled access"}</p>
                  <p className="text-sm text-[#181818]/65">{user.firstName} {user.lastName} · {user.email}</p>
                  <p className="mt-1 text-xs text-[#5C4033]">{accessSummary(user) || "No menus"}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${user.status === "active" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
                    {user.status === "active" ? <ShieldCheck className="h-3 w-3" /> : <ShieldOff className="h-3 w-3" />}
                    {user.status}
                  </span>
                  <Button type="button" variant="secondary" size="sm" onClick={() => startEdit(user)}>
                    <Edit3 className="h-4 w-4" /> Edit
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => setPendingAction({ kind: "status", userId: user.id, status: user.status === "active" ? "suspended" : "active" })}
                  >
                    {user.status === "active" ? "Suspend" : "Reactivate"}
                  </Button>
                  <Button type="button" variant="secondary" size="sm" onClick={() => setPendingAction({ kind: "remove", userId: user.id })}>
                    <Trash2 className="h-4 w-4" /> Remove access
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <AnimatePresence>
        {pendingAction && (
          <PasswordConfirmModal
            title={pendingAction.kind === "remove" ? "Remove sub-admin access" : "Confirm access change"}
            confirmLabel={pendingAction.kind === "remove" ? "Remove access" : "Confirm change"}
            description={
              pendingAction.kind === "remove"
                ? "This restores the account as a regular user and signs out its active sessions."
                : "Enter your password to confirm this Team & access change."
            }
            onCancel={() => setPendingAction(null)}
            onConfirm={confirmAction}
          />
        )}
      </AnimatePresence>
    </AdminLayout>
  );
}