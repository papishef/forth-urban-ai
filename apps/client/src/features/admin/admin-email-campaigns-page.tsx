import { Card, CardContent, CardHeader, CardTitle } from "@forth-urban/ui";
import { useAdminEmailCampaigns } from "./admin-api";
import { AdminLayout } from "./admin-layout";

export function AdminEmailCampaignsPage() {
  const { data, isLoading } = useAdminEmailCampaigns();

  return (
    <AdminLayout title="Email Campaigns">
      <Card>
        <CardHeader>
          <CardTitle>Campaign performance</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading && <p className="text-sm text-[#181818]/60">Loading…</p>}
          {data && data.length === 0 && <p className="text-sm text-[#181818]/60">No campaigns sent yet.</p>}
          {data && data.length > 0 && (
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[#181818]/10 text-[#181818]/60">
                  <th className="py-2">Campaign</th>
                  <th className="py-2">Sent</th>
                  <th className="py-2">Opened</th>
                  <th className="py-2">Clicked</th>
                  <th className="py-2">Bounced</th>
                </tr>
              </thead>
              <tbody>
                {data.map((row) => (
                  <tr key={row.campaign} className="border-b border-[#181818]/5">
                    <td className="py-2 font-medium text-[#181818]">{row.campaign}</td>
                    <td className="py-2">{row.sent}</td>
                    <td className="py-2">{row.opened}</td>
                    <td className="py-2">{row.clicked}</td>
                    <td className="py-2">{row.bounced}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </AdminLayout>
  );
}
