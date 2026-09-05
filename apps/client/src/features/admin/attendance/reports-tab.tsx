import { Download } from "lucide-react";
import { apiFetch } from "../../../lib/api-client.js";

export function ReportsTab({
  dateRange,
}: {
  dateRange: { start: Date; end: Date };
}) {
  const handleExport = async (reportType: string) => {
    const response = await apiFetch("/admin/attendance/report");
    const csv = await response.text();
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `attendance-${reportType}-${Date.now()}.csv`;
    a.click();
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6" style={{ color: "#5C4033" }}>
        Reports
      </h2>

      <div className="grid grid-cols-2 gap-6">
        <ReportCard
          title="Monthly Summary"
          description="Complete attendance overview for the selected date range"
          onDownload={() => handleExport("monthly")}
        />
        <ReportCard
          title="No-Show Report"
          description="List of all inspection bookings where visitors did not check out"
          onDownload={() => handleExport("no-shows")}
        />
        <ReportCard
          title="Dwell Time Analysis"
          description="Detailed breakdown of average time spent on-site by visitor type"
          onDownload={() => handleExport("dwell-analysis")}
        />
        <ReportCard
          title="Department Breakdown"
          description="Staff attendance metrics broken down by department"
          onDownload={() => handleExport("dept-breakdown")}
        />
      </div>
    </div>
  );
}

function ReportCard({
  title,
  description,
  onDownload,
}: {
  title: string;
  description: string;
  onDownload: () => void;
}) {
  return (
    <div
      className="p-6 rounded-lg"
      style={{
        backgroundColor: "#FFF",
        border: "2px solid #E8D5C4",
      }}
    >
      <h3 className="text-lg font-bold mb-2" style={{ color: "#5C4033" }}>
        {title}
      </h3>
      <p className="text-sm mb-4" style={{ color: "#666" }}>
        {description}
      </p>
      <button
        onClick={onDownload}
        className="w-full px-4 py-2 rounded-lg font-semibold flex items-center justify-center gap-2 text-white"
        style={{ backgroundColor: "#5C4033" }}
      >
        <Download size={18} /> Download CSV
      </button>
    </div>
  );
}
