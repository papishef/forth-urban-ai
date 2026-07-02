import { Link } from "react-router-dom";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@forth-urban/ui";
import { useAuth } from "../../lib/auth-context";
import { useProfile } from "../quiz/quiz-api";

/** Dashboard shell — resumes quiz/tools per PRODUCT_SPEC §16 ("post-login dashboard to resume tools"). */
export function DashboardPage() {
  const { user, logout } = useAuth();
  const { data: profile, isLoading } = useProfile(true);

  return (
    <div className="min-h-screen bg-[#FFECE4] px-4 py-10">
      <div className="mx-auto flex max-w-3xl flex-col gap-6">
        <header className="flex items-center justify-between">
          <div>
            <p className="font-heading text-lg font-semibold text-[#181818]">Forth Urban</p>
            <p className="text-sm text-[#181818]/60">Welcome back, {user?.firstName ?? "there"}.</p>
          </div>
          <Button variant="secondary" onClick={() => logout()}>
            Log out
          </Button>
        </header>

        {!isLoading && profile && (
          <Card>
            <CardHeader>
              <CardDescription>Your readiness score</CardDescription>
              <CardTitle className="text-3xl">{profile.readinessScore}/100</CardTitle>
              <CardDescription>Buyer profile: {profile.buyerPersona}</CardDescription>
            </CardHeader>
            <CardContent>
              <Link to="/quiz/home-readiness/result">
                <Button variant="secondary">View full result</Button>
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
      </div>
    </div>
  );
}

