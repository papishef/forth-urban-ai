import { Link } from "react-router-dom";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@forth-urban/ui";
import { useAuth } from "../../lib/auth-context";
import { useProfile } from "../quiz/quiz-api";
import { useMyInspections } from "../inspections/inspections-api";
import { NotificationBell } from "../notifications/notification-bell";

const INSPECTION_STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  completed: "Completed",
  cancelled: "Cancelled",
};

/** Dashboard shell — resumes quiz/tools per PRODUCT_SPEC §16 ("post-login dashboard to resume tools"). */
export function DashboardPage() {
  const { user, logout } = useAuth();
  const { data: profile, isLoading } = useProfile(true);
  const { data: inspections = [] } = useMyInspections();

  return (
    <div className="min-h-screen bg-[#FFECE4] px-4 py-10">
      <div className="mx-auto flex max-w-3xl flex-col gap-6">
        <header className="flex items-center justify-between">
          <div>
            <p className="font-heading text-lg font-semibold text-[#181818]">Forth Urban</p>
            <p className="text-sm text-[#181818]/60">Welcome back, {user?.firstName ?? "there"}.</p>
          </div>
          <div className="flex items-center gap-3">
            <NotificationBell />
            {user?.role === "admin" && (
              <Link to="/admin/users">
                <Button variant="secondary">Admin</Button>
              </Link>
            )}
            <Button variant="secondary" onClick={() => logout()}>
              Log out
            </Button>
          </div>
        </header>

        {!isLoading && profile && (
          <Card>
            <CardHeader>
              <CardDescription>Your readiness score</CardDescription>
              <CardTitle className="text-3xl">{profile.readinessScore}/100</CardTitle>
              <CardDescription>Buyer profile: {profile.buyerPersona}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3">
              <Link to="/quiz/home-readiness/result">
                <Button variant="secondary">View full result</Button>
              </Link>
              <Link to="/properties/recommended">
                <Button>View matched properties</Button>
              </Link>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Next recommended action</CardTitle>
            <CardDescription>
              {profile
                ? "Retake the quiz anytime your budget or plans change."
                : "Take the Home-Readiness Quiz to get matched with properties."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/quiz/home-readiness">
              <Button>{profile ? "Retake Home-Readiness Quiz" : "Start Home-Readiness Quiz"}</Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Not sure which area fits you?</CardTitle>
            <CardDescription>Take the Best Abuja Area Quiz for a quick recommendation.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/quiz/area">
              <Button variant="secondary">Take the Area Quiz</Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Inspections</CardTitle>
            <CardDescription>
              {inspections.length > 0
                ? "Your booked site inspections."
                : "Ready to verify a property in person or virtually?"}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {inspections.map((inspection) => (
              <div
                key={inspection.id}
                className="flex items-center justify-between rounded-lg border border-[#181818]/10 px-3 py-2 text-sm"
              >
                <span>
                  {inspection.recommendedArea ?? "Selected property"} — {inspection.preferredDate} at{" "}
                  {inspection.preferredTime}
                </span>
                <span className="font-medium text-[#5C4033]">
                  {INSPECTION_STATUS_LABELS[inspection.status] ?? inspection.status}
                </span>
              </div>
            ))}
            <Link to="/inspections/book">
              <Button>Book an inspection</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

