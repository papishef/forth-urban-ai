import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { SkeletonGlass } from "@forth-urban/ui";
import type { StaffInput } from "@forth-urban/validation";
import { apiFetch } from "../../../lib/api-client.js";

interface StaffMember {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  department: string;
  role: string;
  status: string;
}

interface AttendanceRecord {
  _id: string;
  checkInTime: string;
  checkOutTime?: string;
  durationMinutes?: number;
  purpose?: string;
}

export function StaffManagementTab() {
  const [showForm, setShowForm] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "attendance", "staff", page],
    queryFn: async () => {
      const response = await apiFetch(`/admin/attendance/staff?page=${page}&limit=20`);
      if (!response.ok) throw new Error("Failed to fetch staff");
      return response.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (input: StaffInput) => {
      const response = await apiFetch("/admin/attendance/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.message || "Failed to create staff");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["admin", "attendance", "staff"],
      });
      setShowForm(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiFetch(`/admin/attendance/staff/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete staff");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["admin", "attendance", "staff"],
      });
    },
  });

  const staff = data?.data?.items || [];
  const totalStaff = data?.data?.total || 0;
  const { data: attendanceData, isLoading: attendanceLoading } = useQuery({
    queryKey: ["admin", "attendance", "staff-detail", selectedStaff?._id],
    queryFn: async () => {
      const response = await apiFetch(`/admin/attendance/staff/${selectedStaff?._id}/attendance`);
      if (!response.ok) throw new Error("Failed to fetch staff attendance");
      return response.json();
    },
    enabled: Boolean(selectedStaff?._id),
  });
  const attendance = attendanceData?.data || [];

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-2xl font-bold" style={{ color: "#5C4033" }}>
          Staff Members
        </h2>
        <button
          onClick={() => {
            setShowForm(true);
          }}
          className="px-6 py-2 rounded-lg font-semibold flex items-center gap-2 text-white cursor-pointer"
          style={{ backgroundColor: "#5C4033" }}
        >
          <Plus size={18} /> Add Staff
        </button>
      </div>

      {showForm && (
        <StaffForm
          onSubmit={(input) => {
            createMutation.mutate(input);
          }}
          onCancel={() => setShowForm(false)}
          isLoading={createMutation.isPending}
        />
      )}

      {createMutation.isError && (
        <p className="mb-4 text-sm font-medium text-red-600">{createMutation.error.message}</p>
      )}

      {selectedStaff && (
        <div className="mb-6 rounded-lg border-2 bg-white p-6" style={{ borderColor: "#E8D5C4" }}>
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#999" }}>
                Attendance details
              </p>
              <h3 className="text-xl font-bold" style={{ color: "#5C4033" }}>
                {selectedStaff.firstName} {selectedStaff.lastName}
              </h3>
              <p className="text-sm" style={{ color: "#666" }}>{selectedStaff.department} · {selectedStaff.email}</p>
            </div>
            <button type="button" onClick={() => setSelectedStaff(null)} className="cursor-pointer px-3 py-1 text-sm font-semibold" style={{ color: "#5C4033" }}>
              Close
            </button>
          </div>
          {attendanceLoading ? (
            <SkeletonGlass className="h-20 w-full" />
          ) : attendance.length === 0 ? (
            <p className="text-sm" style={{ color: "#666" }}>No attendance records found for this staff member.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ backgroundColor: "#F5EEE8" }}>
                    <th className="px-3 py-2 text-left">Date</th>
                    <th className="px-3 py-2 text-left">Check-in</th>
                    <th className="px-3 py-2 text-left">Check-out</th>
                    <th className="px-3 py-2 text-right">Duration</th>
                    <th className="px-3 py-2 text-left">Purpose</th>
                    <th className="px-3 py-2 text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {attendance.map((record: AttendanceRecord) => (
                    <tr key={record._id} style={{ borderBottom: "1px solid #E8D5C4" }}>
                      <td className="px-3 py-2">{new Date(record.checkInTime).toLocaleDateString()}</td>
                      <td className="px-3 py-2">{new Date(record.checkInTime).toLocaleTimeString()}</td>
                      <td className="px-3 py-2">{record.checkOutTime ? new Date(record.checkOutTime).toLocaleTimeString() : "Still checked in"}</td>
                      <td className="px-3 py-2 text-right">{record.durationMinutes ?? "-"} min</td>
                      <td className="px-3 py-2">{record.purpose || "-"}</td>
                      <td className="px-3 py-2">{record.checkOutTime ? "Checked out" : "Open"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border" style={{ borderColor: "#E8D5C4" }}>
        <table className="w-full">
          <thead>
            <tr style={{ backgroundColor: "#F5EEE8" }}>
              <th className="px-6 py-3 text-left text-sm font-semibold">Name</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Email</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Department</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Role</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Status</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <>
                {Array.from({ length: 5 }).map((_, i) => (
                  <tr key={`skeleton-${i}`} style={{ borderBottom: "1px solid #E8D5C4" }}>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={`cell-${i}-${j}`} className="px-6 py-4">
                        <SkeletonGlass className="h-4 w-full" />
                      </td>
                    ))}
                  </tr>
                ))}
              </>
            ) : staff.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center" style={{ color: "#999" }}>
                  No staff members
                </td>
              </tr>
            ) : (
              staff.map((member: StaffMember) => (
                <tr
                  key={member._id}
                  onClick={() => setSelectedStaff(member)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") setSelectedStaff(member);
                  }}
                  tabIndex={0}
                  role="button"
                  className="cursor-pointer hover:bg-[#F5EEE8]/70"
                  style={{ borderBottom: "1px solid #E8D5C4" }}
                >
                  <td className="px-6 py-4 font-semibold">
                    {member.firstName} {member.lastName}
                  </td>
                  <td className="px-6 py-4 text-sm">{member.email}</td>
                  <td className="px-6 py-4 text-sm">{member.department}</td>
                  <td className="px-6 py-4 text-sm">{member.role}</td>
                  <td className="px-6 py-4">
                    <span
                      className="px-3 py-1 rounded-full text-xs font-semibold"
                      style={{
                        backgroundColor: member.status === "active" ? "#E8F8E8" : "#F8E8E8",
                        color: member.status === "active" ? "#007A00" : "#7A0000",
                      }}
                    >
                      {member.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => deleteMutation.mutate(member._id)}
                      disabled={deleteMutation.isPending}
                      className="p-1 hover:opacity-60"
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
      <div className="mt-6 flex items-center justify-between">
        <p className="text-sm" style={{ color: "#666" }}>
          Showing {staff.length} of {totalStaff} staff members
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            disabled={page === 1}
            className="cursor-pointer rounded-lg border px-4 py-2 disabled:cursor-not-allowed disabled:opacity-50"
            style={{ borderColor: "#DDD" }}
          >
            Previous
          </button>
          <span className="px-4 py-2 text-sm" style={{ color: "#666" }}>Page {page}</span>
          <button
            type="button"
            onClick={() => setPage((current) => current + 1)}
            disabled={staff.length === 0 || page * 20 >= totalStaff}
            className="cursor-pointer rounded-lg border px-4 py-2 disabled:cursor-not-allowed disabled:opacity-50"
            style={{ borderColor: "#DDD" }}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}

function StaffForm({
  onSubmit,
  onCancel,
  isLoading,
}: {
  onSubmit: (data: StaffInput) => void;
  onCancel: () => void;
  isLoading: boolean;
}) {
  const [formData, setFormData] = useState<StaffInput>({
    firstName: "",
    lastName: "",
    email: "",
    department: "",
    role: "",
    phone: "",
  });

  return (
    <div
      className="mb-6 p-6 rounded-lg"
      style={{ backgroundColor: "#FFF", border: "2px solid #E8D5C4" }}
    >
      <h3 className="text-xl font-bold mb-4" style={{ color: "#5C4033" }}>
        Add New Staff Member
      </h3>

      <div className="grid grid-cols-2 gap-4">
        <input
          type="text"
          placeholder="First Name"
          value={formData.firstName}
          onChange={(e) =>
            setFormData({ ...formData, firstName: e.target.value })
          }
          className="px-4 py-2 rounded-lg border"
          style={{ borderColor: "#DDD" }}
        />
        <input
          type="text"
          placeholder="Last Name"
          value={formData.lastName}
          onChange={(e) =>
            setFormData({ ...formData, lastName: e.target.value })
          }
          className="px-4 py-2 rounded-lg border"
          style={{ borderColor: "#DDD" }}
        />
        <input
          type="email"
          placeholder="Email"
          value={formData.email}
          onChange={(e) =>
            setFormData({ ...formData, email: e.target.value })
          }
          className="px-4 py-2 rounded-lg border"
          style={{ borderColor: "#DDD" }}
        />
        <input
          type="tel"
          placeholder="Phone"
          value={formData.phone || ""}
          onChange={(e) =>
            setFormData({ ...formData, phone: e.target.value })
          }
          className="px-4 py-2 rounded-lg border"
          style={{ borderColor: "#DDD" }}
        />
        <input
          type="text"
          placeholder="Department"
          value={formData.department}
          onChange={(e) =>
            setFormData({ ...formData, department: e.target.value })
          }
          className="px-4 py-2 rounded-lg border"
          style={{ borderColor: "#DDD" }}
        />
        <input
          type="text"
          placeholder="Role"
          value={formData.role}
          onChange={(e) =>
            setFormData({ ...formData, role: e.target.value })
          }
          className="px-4 py-2 rounded-lg border"
          style={{ borderColor: "#DDD" }}
        />
      </div>

      <div className="mt-4 flex gap-4">
        <button
          onClick={() => onSubmit(formData)}
          disabled={isLoading}
          className="px-6 py-2 rounded-lg font-semibold text-white cursor-pointer"
          style={{ backgroundColor: isLoading ? "#999" : "#5C4033" }}
        >
          {isLoading ? "Creating..." : "Create"}
        </button>
        <button
          onClick={onCancel}
          className="px-6 py-2 rounded-lg font-semibold border cursor-pointer"
          style={{ borderColor: "#5C4033", color: "#5C4033" }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
