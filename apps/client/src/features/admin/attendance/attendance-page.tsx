import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, Users, BarChart3, FileText, ClipboardList } from "lucide-react";
import { AttendanceLogsTab } from "./attendance-logs";
import { StaffManagementTab } from "./staff-management";
import { AnalyticsDashboardTab } from "./analytics-dashboard";
import { AnomaliesViewTab } from "./anomalies-view";
import { ReportsTab } from "./reports-tab";
import { apiFetch } from "../../../lib/api-client.js";

type TabType = "logs" | "staff" | "analytics" | "anomalies" | "reports";

export function AttendancePage() {
  const [activeTab, setActiveTab] = useState<TabType>("logs");
  const [dateRange, setDateRange] = useState<{ start: Date; end: Date }>(() => {
    const end = new Date();
    const start = new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
    return { start, end };
  });

  // Fetch summary stats
  const { data: summary } = useQuery({
    queryKey: ["admin", "attendance", "summary", dateRange],
    queryFn: async () => {
      const start = dateRange.start.toISOString();
      const end = dateRange.end.toISOString();
      const response = await apiFetch(`/admin/attendance/analytics/summary?startDate=${start}&endDate=${end}`);
      if (!response.ok) throw new Error("Failed to fetch summary");
      return response.json();
    },
  });

  const stats = summary?.data || {};

  return (
    <div className="attendance-page min-h-screen" style={{ backgroundColor: "#FFECE4" }}>
      {/* Header */}
      <div className="border-b" style={{ borderColor: "#E8D5C4" }}>
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-4xl font-bold" style={{ color: "#5C4033", fontFamily: "'Manrope', sans-serif" }}>
              Attendance Register
            </h1>

            {/* Date Range Picker */}
            <div className="flex gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2">From</label>
                <input
                  type="date"
                  value={dateRange.start.toISOString().split("T")[0]}
                  onChange={(e) =>
                    setDateRange({
                      ...dateRange,
                      start: new Date(e.target.value),
                    })
                  }
                  className="px-4 py-2 rounded-lg border"
                  style={{ borderColor: "#DDD" }}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">To</label>
                <input
                  type="date"
                  value={dateRange.end.toISOString().split("T")[0]}
                  onChange={(e) =>
                    setDateRange({
                      ...dateRange,
                      end: new Date(e.target.value),
                    })
                  }
                  className="px-4 py-2 rounded-lg border"
                  style={{ borderColor: "#DDD" }}
                />
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-4 gap-4">
            <StatCard
              label="Total Check-Ins"
              value={stats.totalCheckIns || 0}
              icon="✓"
            />
            <StatCard
              label="Unique Staff"
              value={stats.uniqueStaffCount || 0}
              icon="👤"
            />
            <StatCard
              label="Unique Visitors"
              value={stats.uniqueVisitorCount || 0}
              icon="🚶"
            />
            <StatCard
              label="Avg Dwell (min)"
              value={Math.round(stats.avgDwellMinutes || 0)}
              icon="⏱"
            />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b" style={{ borderColor: "#E8D5C4" }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-8">
            <TabButton
              active={activeTab === "logs"}
              onClick={() => setActiveTab("logs")}
              icon={<ClipboardList size={20} />}
              label="Logs"
            />
            <TabButton
              active={activeTab === "staff"}
              onClick={() => setActiveTab("staff")}
              icon={<Users size={20} />}
              label="Staff"
            />
            <TabButton
              active={activeTab === "analytics"}
              onClick={() => setActiveTab("analytics")}
              icon={<BarChart3 size={20} />}
              label="Analytics"
            />
            <TabButton
              active={activeTab === "anomalies"}
              onClick={() => setActiveTab("anomalies")}
              icon={<AlertCircle size={20} />}
              label="Anomalies"
            />
            <TabButton
              active={activeTab === "reports"}
              onClick={() => setActiveTab("reports")}
              icon={<FileText size={20} />}
              label="Reports"
            />
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {activeTab === "logs" && <AttendanceLogsTab dateRange={dateRange} />}
        {activeTab === "staff" && <StaffManagementTab />}
        {activeTab === "analytics" && <AnalyticsDashboardTab dateRange={dateRange} />}
        {activeTab === "anomalies" && <AnomaliesViewTab dateRange={dateRange} />}
        {activeTab === "reports" && <ReportsTab dateRange={dateRange} />}
      </div>
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: number | string; icon: string }) {
  return (
    <div
      className="rounded-lg p-6"
      style={{
        backgroundColor: "#FFF",
        border: `2px solid #E8D5C4`,
      }}
    >
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-semibold mb-2" style={{ color: "#666" }}>
            {label}
          </p>
          <p className="text-4xl font-bold" style={{ color: "#5C4033" }}>
            {value}
          </p>
        </div>
        <div className="text-4xl">{icon}</div>
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 py-4 px-2 border-b-2 font-semibold transition-all cursor-pointer ${
        active ? "border-b-2" : ""
      }`}
      style={{
        borderColor: active ? "#5C4033" : "transparent",
        color: active ? "#5C4033" : "#999",
      }}
    >
      {icon}
      {label}
    </button>
  );
}
