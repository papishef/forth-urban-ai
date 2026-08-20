import { useState } from "react";
import { Mail, CheckCircle2, Clock, UserX, Users } from "lucide-react";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  BuildingLoader,
} from "@forth-urban/ui";
import { AdminLayout } from "./admin-layout";
import { useAdminNewsletterSubscribers } from "./admin-api";

const PAGE_SIZE = 20;

export function AdminNewsletterPage() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);

  const { data, isLoading } = useAdminNewsletterSubscribers(page, statusFilter);

  const handleFilterChange = (status: string | undefined) => {
    setStatusFilter(status);
    setPage(1);
  };

  return (
    <AdminLayout title="Newsletter Subscribers">
      <div className="space-y-6">
        {/* Top Header */}
        <div>
          <h2 className="font-heading text-2xl font-bold text-[#181818]">
            Newsletter Subscribers
          </h2>
          <p className="text-sm text-[#181818]/60">
            Double opt-in email list for market insights and property announcements.
          </p>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="rounded-2xl bg-white p-4 border border-[#181818]/10 shadow-sm">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#181818]/60 mb-1">
              <Users className="h-4 w-4 text-[#5C4033]" />
              <span>Total Contacts</span>
            </div>
            <div className="font-heading text-2xl font-bold text-[#181818]">
              {data?.counts.total ?? "—"}
            </div>
          </div>

          <div className="rounded-2xl bg-white p-4 border border-green-200 bg-green-50/30 shadow-sm">
            <div className="flex items-center gap-2 text-xs font-semibold text-green-800 mb-1">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span>Confirmed</span>
            </div>
            <div className="font-heading text-2xl font-bold text-green-900">
              {data?.counts.confirmed ?? "—"}
            </div>
          </div>

          <div className="rounded-2xl bg-white p-4 border border-amber-200 bg-amber-50/30 shadow-sm">
            <div className="flex items-center gap-2 text-xs font-semibold text-amber-800 mb-1">
              <Clock className="h-4 w-4 text-amber-600" />
              <span>Pending</span>
            </div>
            <div className="font-heading text-2xl font-bold text-amber-900">
              {data?.counts.pending ?? "—"}
            </div>
          </div>

          <div className="rounded-2xl bg-white p-4 border border-[#181818]/10 shadow-sm">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#181818]/60 mb-1">
              <UserX className="h-4 w-4 text-red-500" />
              <span>Unsubscribed</span>
            </div>
            <div className="font-heading text-2xl font-bold text-[#181818]">
              {data?.counts.unsubscribed ?? "—"}
            </div>
          </div>
        </div>

        {/* Subscribers Table */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle>Subscriber List</CardTitle>
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
                onClick={() => handleFilterChange("confirmed")}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${
                  statusFilter === "confirmed"
                    ? "bg-[#5C4033] text-white"
                    : "bg-white text-[#181818]/70 border border-[#181818]/10"
                }`}
              >
                Confirmed
              </button>
              <button
                type="button"
                onClick={() => handleFilterChange("pending")}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${
                  statusFilter === "pending"
                    ? "bg-[#5C4033] text-white"
                    : "bg-white text-[#181818]/70 border border-[#181818]/10"
                }`}
              >
                Pending
              </button>
            </div>
          </CardHeader>

          <CardContent>
            {isLoading && <BuildingLoader size="sm" label="Loading subscribers…" className="py-8" />}

            {data && data.items.length === 0 && (
              <div className="py-12 text-center">
                <Mail className="h-10 w-10 text-[#5C4033]/40 mx-auto mb-2" />
                <p className="text-sm text-[#181818]/60">No subscribers found.</p>
              </div>
            )}

            {data && data.items.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-[#181818]/10 text-xs font-semibold text-[#181818]/60 uppercase">
                      <th className="py-3 px-2">Email</th>
                      <th className="py-3 px-2">Status</th>
                      <th className="py-3 px-2">Source</th>
                      <th className="py-3 px-2">Subscribed At</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.items.map((sub) => (
                      <tr
                        key={sub.id}
                        className="border-b border-[#181818]/5 hover:bg-white/50 transition"
                      >
                        <td className="py-3.5 px-2 font-medium text-[#181818]">
                          {sub.email}
                        </td>
                        <td className="py-3.5 px-2">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${
                              sub.status === "confirmed"
                                ? "bg-green-100 text-green-800"
                                : sub.status === "pending"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-zinc-100 text-zinc-700"
                            }`}
                          >
                            {sub.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-3.5 px-2 text-xs text-[#181818]/60">
                          {sub.source}
                        </td>
                        <td className="py-3.5 px-2 text-xs text-[#181818]/60">
                          {new Date(sub.createdAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
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
      </div>
    </AdminLayout>
  );
}
