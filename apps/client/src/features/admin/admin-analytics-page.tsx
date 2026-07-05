import { Card, CardContent, CardHeader, CardTitle } from "@forth-urban/ui";
import { useAdminQuizAnalytics } from "./admin-api";
import { AdminLayout } from "./admin-layout";

/** Simple CSS/div bar — no chart.js dependency needed for this scale of data (Phase 7 scope decision). */
function Bar({ label, value, max }: { label: string; value: number; max: number }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="w-40 shrink-0 text-[#181818]/70">{label}</span>
      <div className="h-3 flex-1 overflow-hidden rounded-full bg-[#181818]/10">
        <div className="h-full rounded-full bg-[#5C4033]" style={{ width: `${pct}%` }} />
      </div>
      <span className="w-10 shrink-0 text-right font-medium text-[#181818]">{value}</span>
    </div>
  );
}

export function AdminAnalyticsPage() {
  const { data, isLoading } = useAdminQuizAnalytics();

  if (isLoading || !data) {
    return (
      <AdminLayout title="Analytics">
        <p className="text-sm text-[#181818]/60">Loading…</p>
      </AdminLayout>
    );
  }

  const maxBand = Math.max(1, ...data.readinessBandDistribution.map((b) => b.count));
  const maxLead = Math.max(1, ...data.leadCategoryDistribution.map((c) => c.count));

  return (
    <AdminLayout title="Analytics">
      <div className="flex flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Quiz funnel</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {data.funnels.map((funnel) => (
              <div key={funnel.quizType} className="rounded-lg border border-[#181818]/10 p-3 text-sm">
                <p className="mb-2 font-medium text-[#181818]">{funnel.quizType}</p>
                <Bar label="Started" value={funnel.started} max={Math.max(1, funnel.started)} />
                <Bar label="Completed" value={funnel.completed} max={Math.max(1, funnel.started)} />
                <p className="mt-1 text-xs text-[#181818]/60">
                  {Math.round(funnel.completionRate * 100)}% completion rate
                </p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Readiness band distribution</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {data.readinessBandDistribution.map((band) => (
              <Bar key={band.band} label={band.band} value={band.count} max={maxBand} />
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Lead category distribution</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {data.leadCategoryDistribution.map((cat) => (
              <Bar key={cat.leadCategory} label={cat.leadCategory} value={cat.count} max={maxLead} />
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Inspections booked</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold text-[#181818]">{data.inspectionsBooked}</p>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
