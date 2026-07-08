import { Link, useLocation, useNavigate } from "react-router-dom";
import { BuildingLoader, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Logo } from "@forth-urban/ui";
import type { AreaQuizResultDTO } from "@forth-urban/shared-types";
import { useAreaQuizResult } from "./quiz-api";

export function AreaQuizResultPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const stateResult = location.state as AreaQuizResultDTO | undefined;
  const { data: fetchedResult, isLoading } = useAreaQuizResult(!stateResult);
  const result = stateResult ?? fetchedResult;

  if (!result && isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FFECE4] px-4 py-10">
        <BuildingLoader size="lg" label="Loading your result…" />
      </div>
    );
  }

  if (!result) {
    return (
      <div className="min-h-screen bg-[#FFECE4] px-4 py-10">
        <div className="mx-auto max-w-xl text-center">
          <p className="mb-4 text-[#181818]/70">Take the Best Abuja Area Quiz to see your result.</p>
          <Button onClick={() => navigate("/quiz/area")}>Start the quiz</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFECE4] px-4 py-10">
      <div className="mx-auto flex max-w-xl flex-col gap-6">
        <Link to="/dashboard">
          <Logo className="h-7" />
        </Link>
        <Card>
          <CardHeader>
            <CardDescription>Your recommended area</CardDescription>
            <CardTitle className="text-3xl">{result.recommendedArea}</CardTitle>
          </CardHeader>
        </Card>

        <Card className="border-2 border-[#5C4033]">
          <CardHeader>
            <CardDescription>Next recommended action</CardDescription>
            <CardTitle>{result.nextAction.action}</CardTitle>
            <CardDescription>{result.nextAction.reason}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Button onClick={() => navigate(`/inspections/book?area=${encodeURIComponent(result.recommendedArea)}`)}>
              Book an inspection in this area
            </Button>
            <Button variant="secondary" onClick={() => navigate("/dashboard")}>
              Go to dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
