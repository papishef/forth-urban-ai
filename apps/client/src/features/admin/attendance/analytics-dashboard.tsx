import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "../../../lib/api-client.js";

interface DailyTrendEntry {
  date: string;
  checkInCount: number;
  uniqueVisitors: number;
  avgDwellMinutes: number;
  noShowCount: number;
}

interface AnalyticsSnapshot {
  peakHour?: { hour: number; checkInCount: number } | null;
  noShowRate?: number;
  dailyTrend?: DailyTrendEntry[];
}

export function AnalyticsDashboardTab({
  dateRange,
}: {
  dateRange: { start: Date; end: Date };
}) {
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "attendance", "analytics", dateRange],
    queryFn: async () => {
      const start = dateRange.start.toISOString();
      const end = dateRange.end.toISOString();
      const response = await apiFetch(
        `/admin/attendance/analytics/summary?startDate=${start}&endDate=${end}`
      );
      if (!response.ok) throw new Error("Failed to fetch analytics");
      return response.json();
    },
  });

  const stats: AnalyticsSnapshot = data?.data || {};
  const dailyTrend = [...(stats.dailyTrend || [])].sort(
    (first, second) => new Date(second.date).getTime() - new Date(first.date).getTime(),
  );

  if (isLoading) return <div>Loading analytics...</div>;

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6" style={{ color: "#5C4033" }}>
        Analytics Dashboard
      </h2>

      <div className="grid grid-cols-2 gap-6 mb-8">
        <AnalyticsCard
          title="Peak Hour"
          value={
            stats.peakHour
              ? `${stats.peakHour.hour}:00 (${stats.peakHour.checkInCount} visits)`
              : "N/A"
          }
        />
        <AnalyticsCard
          title="No-Show Rate"
          value={`${stats.noShowRate || 0}%`}
        />
      </div>

      <div className="bg-white rounded-lg p-6" style={{ border: "2px solid #E8D5C4" }}>
        <h3 className="text-xl font-bold mb-4" style={{ color: "#5C4033" }}>
          Daily Trend (Last 30 Days)
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ backgroundColor: "#F5EEE8" }}>
                <th className="px-4 py-2 text-left">Date</th>
                <th className="px-4 py-2 text-right">Check-Ins</th>
                <th className="px-4 py-2 text-right">Unique Visitors</th>
                <th className="px-4 py-2 text-right">Avg Dwell (min)</th>
                <th className="px-4 py-2 text-right">No-Shows</th>
              </tr>
            </thead>
            <tbody>
              {dailyTrend.map((day, idx: number) => (
                <tr
                  key={idx}
                  style={{
                    borderBottom: "1px solid #E8D5C4",
                    backgroundColor: idx % 2 === 0 ? "#FAFAFA" : "#FFF",
                  }}
                >
                  <td className="px-4 py-2">{day.date}</td>
                  <td className="px-4 py-2 text-right">{day.checkInCount}</td>
                  <td className="px-4 py-2 text-right">
                    {day.uniqueVisitors}
                  </td>
                  <td className="px-4 py-2 text-right">
                    {Math.round(day.avgDwellMinutes)}
                  </td>
                  <td className="px-4 py-2 text-right">{day.noShowCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function AnalyticsCard({
  title,
  value,
}: {
  title: string;
  value: string | number;
}) {
  return (
    <div
      className="p-6 rounded-lg"
      style={{
        backgroundColor: "#FFF",
        border: "2px solid #E8D5C4",
      }}
    >
      <p className="text-sm font-semibold mb-2" style={{ color: "#666" }}>
        {title}
      </p>
      <p className="text-3xl font-bold" style={{ color: "#5C4033" }}>
        {value}
      </p>
    </div>
  );
}
