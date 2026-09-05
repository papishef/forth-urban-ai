import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Download, Trash2, Edit } from "lucide-react";
import { SkeletonGlass } from "@forth-urban/ui";
import { apiFetch } from "../../../lib/api-client.js";

interface AttendanceLog {
  _id: string;
  type: "staff" | "visitor";
  visitorName?: string;
  staffId?: { firstName: string; lastName: string; department: string };
  checkInTime: string;
  checkOutTime?: string;
  durationMinutes?: number;
  purpose: string;
  isNoShow: boolean;
  notes?: string;
}

export function AttendanceLogsTab({ dateRange }: { dateRange: { start: Date; end: Date } }) {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [filter, setFilter] = useState({ type: "", status: "", purpose: "" });
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "attendance", "logs", page, limit, filter],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        startDate: dateRange.start.toISOString(),
        endDate: dateRange.end.toISOString(),
        ...(filter.type && { type: filter.type }),
        ...(filter.status && { status: filter.status }),
        ...(filter.purpose && { purpose: filter.purpose }),
      });

      const response = await apiFetch(`/admin/attendance/logs?${params}`);
      if (!response.ok) throw new Error("Failed to fetch logs");
      return response.json();
    },
  });

  const deleteLogMutation = useMutation({
    mutationFn: async (logId: string) => {
      const response = await apiFetch(`/admin/attendance/${logId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete log");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["admin", "attendance", "logs"],
      });
    },
  });

  const exportCSV = async () => {
    const response = await apiFetch("/admin/attendance/report");
    const csv = await response.text();
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `attendance-report-${Date.now()}.csv`;
    a.click();
  };

  const logs = data?.data?.items || [];
  const total = data?.data?.total || 0;

  return (
    <div>
      {/* Filters */}
      <div className="mb-6 grid grid-cols-4 gap-4">
        <select
          value={filter.type}
          onChange={(e) => {
            setFilter({ ...filter, type: e.target.value });
            setPage(1);
          }}
          className="px-4 py-2 rounded-lg border"
          style={{ borderColor: "#DDD" }}
        >
          <option value="">All Types</option>
          <option value="staff">Staff</option>
          <option value="visitor">Visitor</option>
        </select>

        <select
          value={filter.status}
          onChange={(e) => {
            setFilter({ ...filter, status: e.target.value });
            setPage(1);
          }}
          className="px-4 py-2 rounded-lg border"
          style={{ borderColor: "#DDD" }}
        >
          <option value="">All Status</option>
          <option value="checked-out">Checked Out</option>
          <option value="pending">Pending</option>
          <option value="no-show">No-Show</option>
        </select>

        <input
          type="text"
          placeholder="Filter by purpose..."
          value={filter.purpose}
          onChange={(e) => {
            setFilter({ ...filter, purpose: e.target.value });
            setPage(1);
          }}
          className="px-4 py-2 rounded-lg border"
          style={{ borderColor: "#DDD" }}
        />

        <button
          onClick={exportCSV}
          className="px-4 py-2 rounded-lg font-semibold flex items-center gap-2 justify-center"
          style={{
            backgroundColor: "#5C4033",
            color: "#FFF",
          }}
        >
          <Download size={18} /> Export
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border" style={{ borderColor: "#E8D5C4" }}>
        <table className="w-full">
          <thead>
            <tr style={{ backgroundColor: "#F5EEE8" }}>
              <th className="px-6 py-3 text-left text-sm font-semibold">Date</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Name</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Type</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Check-In</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Check-Out</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Duration</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Purpose</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Status</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <>
                {Array.from({ length: 5 }).map((_, i) => (
                  <tr key={`skeleton-${i}`} style={{ borderBottom: "1px solid #E8D5C4" }}>
                    {Array.from({ length: 9 }).map((_, j) => (
                      <td key={`cell-${i}-${j}`} className="px-6 py-4">
                        <SkeletonGlass className="h-4 w-full" />
                      </td>
                    ))}
                  </tr>
                ))}
              </>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-6 py-4 text-center" style={{ color: "#999" }}>
                  No records found
                </td>
              </tr>
            ) : (
              logs.map((log: AttendanceLog) => (
                <tr key={log._id} style={{ borderBottom: "1px solid #E8D5C4" }}>
                  <td className="px-6 py-4 text-sm">
                    {new Date(log.checkInTime).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold">
                    {log.type === "staff"
                      ? `${log.staffId?.firstName} ${log.staffId?.lastName}`
                      : log.visitorName}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span
                      className="px-3 py-1 rounded-full text-xs font-semibold"
                      style={{
                        backgroundColor: log.type === "staff" ? "#E8F4F8" : "#F8E8E8",
                        color: log.type === "staff" ? "#006A7A" : "#7A0000",
                      }}
                    >
                      {log.type === "staff" ? "Staff" : "Visitor"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {new Date(log.checkInTime).toLocaleTimeString()}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {log.checkOutTime
                      ? new Date(log.checkOutTime).toLocaleTimeString()
                      : "-"}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {log.durationMinutes ? `${log.durationMinutes}m` : "-"}
                  </td>
                  <td className="px-6 py-4 text-sm">{log.purpose}</td>
                  <td className="px-6 py-4 text-sm">
                    <span
                      className="px-3 py-1 rounded-full text-xs font-semibold"
                      style={{
                        backgroundColor: log.isNoShow
                          ? "#FFE8E8"
                          : log.checkOutTime
                            ? "#E8F8E8"
                            : "#F8E8E8",
                        color: log.isNoShow
                          ? "#7A0000"
                          : log.checkOutTime
                            ? "#007A00"
                            : "#7A6600",
                      }}
                    >
                      {log.isNoShow
                        ? "No-Show"
                        : log.checkOutTime
                          ? "Checked Out"
                          : "Pending"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <button
                      onClick={() => deleteLogMutation.mutate(log._id)}
                      disabled={deleteLogMutation.isPending}
                      className="p-1 hover:opacity-60"
                      title="Delete"
                    >
                      <Trash2 size={16} style={{ color: "#C00" }} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="mt-6 flex justify-between items-center">
        <div style={{ color: "#666" }}>
          Showing {logs.length} of {total} records
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className="px-4 py-2 rounded-lg border disabled:opacity-50"
            style={{ borderColor: "#DDD" }}
          >
            Previous
          </button>
          <span className="px-4 py-2">
            Page {page}
          </span>
          <button
            onClick={() => setPage(page + 1)}
            disabled={logs.length < limit}
            className="px-4 py-2 rounded-lg border disabled:opacity-50"
            style={{ borderColor: "#DDD" }}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
