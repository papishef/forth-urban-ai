import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, AlertCircle, Info } from "lucide-react";
import { apiFetch } from "../../../lib/api-client.js";

interface AttendanceAnomaly {
  id: string;
  type: string;
  severity: "critical" | "warning" | "info";
  visitorName?: string;
  message: string;
  timestamp: string;
}

export function AnomaliesViewTab({
  dateRange,
}: {
  dateRange: { start: Date; end: Date };
}) {
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "attendance", "anomalies", dateRange],
    queryFn: async () => {
      const start = dateRange.start.toISOString();
      const end = dateRange.end.toISOString();
      const response = await apiFetch(
        `/admin/attendance/analytics/anomalies?startDate=${start}&endDate=${end}`
      );
      if (!response.ok) throw new Error("Failed to fetch anomalies");
      return response.json();
    },
  });

  const anomalies: AttendanceAnomaly[] = [...(data?.data?.anomalies || [])].sort(
    (first: AttendanceAnomaly, second: AttendanceAnomaly) => new Date(second.timestamp).getTime() - new Date(first.timestamp).getTime(),
  );

  if (isLoading) return <div>Loading anomalies...</div>;

  const criticalAnomalies = anomalies.filter(
    (a) => a.severity === "critical"
  );
  const warningAnomalies = anomalies.filter((a) => a.severity === "warning");
  const infoAnomalies = anomalies.filter((a) => a.severity === "info");

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6" style={{ color: "#5C4033" }}>
        Anomalies & Alerts
      </h2>

      {criticalAnomalies.length > 0 && (
        <AnomalySection
          title="Critical"
          anomalies={criticalAnomalies}
          severity="critical"
        />
      )}

      {warningAnomalies.length > 0 && (
        <AnomalySection
          title="Warnings"
          anomalies={warningAnomalies}
          severity="warning"
        />
      )}

      {infoAnomalies.length > 0 && (
        <AnomalySection
          title="Information"
          anomalies={infoAnomalies}
          severity="info"
        />
      )}

      {anomalies.length === 0 && (
        <div className="text-center p-12" style={{ color: "#999" }}>
          No anomalies detected. All activity looks normal!
        </div>
      )}
    </div>
  );
}

function AnomalySection({
  title,
  anomalies,
  severity,
}: {
  title: string;
  anomalies: AttendanceAnomaly[];
  severity: "critical" | "warning" | "info";
}) {
  const bgColors = {
    critical: "#FFE8E8",
    warning: "#FFF8E8",
    info: "#E8F4F8",
  };

  const borderColors = {
    critical: "#FF6B6B",
    warning: "#FFA500",
    info: "#0099CC",
  };

  const iconColors = {
    critical: "#C00",
    warning: "#CC6600",
    info: "#0066AA",
  };

  return (
    <div className="mb-8">
      <h3 className="text-lg font-bold mb-4" style={{ color: "#5C4033" }}>
        {title}
      </h3>

      <div className="space-y-3">
        {anomalies.map((anomaly) => (
          <div
            key={anomaly.id}
            className="p-4 rounded-lg"
            style={{
              backgroundColor: bgColors[severity],
              border: `2px solid ${borderColors[severity]}`,
            }}
          >
            <div className="flex gap-4">
              <div style={{ color: iconColors[severity] }}>
                {severity === "critical" && <AlertTriangle size={24} />}
                {severity === "warning" && <AlertCircle size={24} />}
                {severity === "info" && <Info size={24} />}
              </div>

              <div className="flex-1">
                <div className="font-semibold" style={{ color: "#181818" }}>
                  {anomaly.visitorName}
                </div>
                <div style={{ color: "#666" }}>{anomaly.message}</div>
                <div
                  className="text-xs mt-1"
                  style={{ color: iconColors[severity] }}
                >
                  {new Date(anomaly.timestamp).toLocaleString()}
                </div>
              </div>

              <button
                className="px-4 py-1 rounded text-sm font-semibold"
                style={{
                  backgroundColor: borderColors[severity],
                  color: "#FFF",
                  opacity: 0.8,
                }}
              >
                Follow Up
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
