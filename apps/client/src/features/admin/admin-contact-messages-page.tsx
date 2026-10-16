import { useState } from "react";
import { Mail, Phone, Clock, MessageSquare, Archive } from "lucide-react";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  BuildingLoader,
} from "@forth-urban/ui";
import { AdminLayout } from "./admin-layout";
import {
  useAdminContactMessages,
  useAdminUpdateContactMessage,
} from "./admin-api";
import type { ContactMessageDTO } from "@forth-urban/shared-types";
import { canWriteAdminMenu } from "../../lib/admin-access";
import { useAuth } from "../../lib/auth-context";

const PAGE_SIZE = 20;

export function AdminContactMessagesPage() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [activeMessage, setActiveMessage] = useState<ContactMessageDTO | null>(null);

  const { data, isLoading } = useAdminContactMessages(page, statusFilter);
  const updateStatusMutation = useAdminUpdateContactMessage();
  const { user } = useAuth();
  const canWrite = canWriteAdminMenu(user, "contact-messages");

  const handleFilterChange = (status: string | undefined) => {
    setStatusFilter(status);
    setPage(1);
  };

  const handleStatusChange = async (id: string, status: "new" | "read" | "archived") => {
    if (!canWrite) return;
    await updateStatusMutation.mutateAsync({ id, input: { status } });
    if (activeMessage && activeMessage.id === id) {
      setActiveMessage({ ...activeMessage, status });
    }
  };

  return (
    <AdminLayout title="Contact Messages & Inquiries">
      <div className="space-y-6">
        {/* Top Header */}
        <div>
          <h2 className="font-heading text-2xl font-bold text-[#181818]">
            Website Inquiries & Contact Leads
          </h2>
          <p className="text-sm text-[#181818]/60">
            Messages submitted by potential buyers, investors, and partners via the public contact form.
          </p>
        </div>

        {/* Messages List Table */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle>Inquiries Inbox</CardTitle>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => handleFilterChange(undefined)}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${
                  statusFilter === undefined
                    ? "bg-[#5C4033] text-white"
                    : "bg-white text-[#181818]/70 border border-[#181818]/10"
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => handleFilterChange("new")}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${
                  statusFilter === "new"
                    ? "bg-[#5C4033] text-white"
                    : "bg-white text-[#181818]/70 border border-[#181818]/10"
                }`}
              >
                New
              </button>
              <button
                type="button"
                onClick={() => handleFilterChange("read")}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${
                  statusFilter === "read"
                    ? "bg-[#5C4033] text-white"
                    : "bg-white text-[#181818]/70 border border-[#181818]/10"
                }`}
              >
                Read
              </button>
            </div>
          </CardHeader>

          <CardContent>
            {isLoading && <BuildingLoader size="sm" label="Loading inquiries…" className="py-8" />}

            {data && data.items.length === 0 && (
              <div className="py-12 text-center">
                <MessageSquare className="h-10 w-10 text-[#5C4033]/40 mx-auto mb-2" />
                <p className="text-sm text-[#181818]/60">No contact inquiries found.</p>
              </div>
            )}

            {data && data.items.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-[#181818]/10 text-xs font-semibold text-[#181818]/60 uppercase">
                      <th className="py-3 px-2">Sender</th>
                      <th className="py-3 px-2">Reason</th>
                      <th className="py-3 px-2">Preview</th>
                      <th className="py-3 px-2">Status</th>
                      <th className="py-3 px-2">Date</th>
                      <th className="py-3 px-2 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.items.map((msg) => (
                      <tr
                        key={msg.id}
                        onClick={() => {
                          setActiveMessage(msg);
                          if (msg.status === "new" && canWrite) {
                            handleStatusChange(msg.id, "read");
                          }
                        }}
                        className={`border-b border-[#181818]/5 hover:bg-white/60 transition cursor-pointer ${
                          msg.status === "new" ? "bg-amber-50/40 font-medium" : ""
                        }`}
                      >
                        <td className="py-3.5 px-2">
                          <div className="text-[#181818]">{msg.name}</div>
                          <div className="text-xs text-[#181818]/60">{msg.email}</div>
                        </td>
                        <td className="py-3.5 px-2">
                          <span className="inline-flex rounded-full bg-[#FFECE4] px-2.5 py-0.5 text-xs font-bold text-[#5C4033]">
                            {msg.reason}
                          </span>
                        </td>
                        <td className="py-3.5 px-2 max-w-xs truncate text-xs text-[#181818]/70">
                          {msg.message}
                        </td>
                        <td className="py-3.5 px-2">
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-bold ${
                              msg.status === "new"
                                ? "bg-amber-100 text-amber-800"
                                : msg.status === "read"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-zinc-100 text-zinc-700"
                            }`}
                          >
                            {msg.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-3.5 px-2 text-xs text-[#181818]/60">
                          {new Date(msg.createdAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}
                        </td>
                        <td className="py-3.5 px-2 text-right">
                          <Button
                            variant="secondary"
                            size="sm"
                            className="h-7 px-2.5 text-xs"
                          >
                            View
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {data && data.total > PAGE_SIZE && (
              <div className="mt-6 flex items-center justify-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </Button>
                <span className="flex items-center px-4 text-xs font-semibold text-[#181818]/70">
                  Page {data.page} of {Math.ceil(data.total / PAGE_SIZE)}
                </span>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={page * PAGE_SIZE >= data.total}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Message Viewer Modal */}
        {activeMessage && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl space-y-6">
              <div className="flex items-center justify-between border-b border-[#181818]/10 pb-4">
                <div>
                  <h3 className="font-heading text-lg font-bold text-[#181818]">
                    Inquiry from {activeMessage.name}
                  </h3>
                  <span className="inline-block rounded-full bg-[#FFECE4] px-2.5 py-0.5 text-xs font-bold text-[#5C4033] mt-1">
                    Reason: {activeMessage.reason}
                  </span>
                </div>
                <div className="text-right text-xs text-[#181818]/60">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    <span>{new Date(activeMessage.createdAt).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3 text-xs bg-[#FFECE4]/40 p-3 rounded-xl">
                  <div>
                    <span className="text-[#181818]/60 block">Email:</span>
                    <a
                      href={`mailto:${activeMessage.email}`}
                      className="font-semibold text-[#5C4033] hover:underline flex items-center gap-1 mt-0.5"
                    >
                      <Mail className="h-3.5 w-3.5" />
                      {activeMessage.email}
                    </a>
                  </div>
                  <div>
                    <span className="text-[#181818]/60 block">Phone:</span>
                    {activeMessage.phone ? (
                      <a
                        href={`tel:${activeMessage.phone}`}
                        className="font-semibold text-[#5C4033] hover:underline flex items-center gap-1 mt-0.5"
                      >
                        <Phone className="h-3.5 w-3.5" />
                        {activeMessage.phone}
                      </a>
                    ) : (
                      <span className="font-semibold text-[#181818]/60 mt-0.5 block">Not provided</span>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-[#181818]/70 uppercase tracking-wider mb-2">
                    Message Content:
                  </h4>
                  <div className="rounded-2xl border border-[#181818]/10 bg-zinc-50 p-4 text-sm text-[#181818] leading-relaxed whitespace-pre-wrap">
                    {activeMessage.message}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-[#181818]/10 pt-4">
                <div className="flex gap-2">
                  {canWrite && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleStatusChange(activeMessage.id, "archived")}
                      className="gap-1 text-xs text-[#181818]/70"
                    >
                      <Archive className="h-3.5 w-3.5" />
                      <span>Archive</span>
                    </Button>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setActiveMessage(null)}
                    className="!bg-[#5C4033]"
                  >
                    Close
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
