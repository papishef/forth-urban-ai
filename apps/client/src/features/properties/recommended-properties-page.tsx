import { Link, useNavigate } from "react-router-dom";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@forth-urban/ui";
import type { RecommendedPropertyDTO } from "@forth-urban/shared-types";
import { useRecommendedProperties } from "./properties-api";
import { useRecommendationExplanation } from "../ai-advisory/ai-advisory-api";
import { AiExplanation } from "../ai-advisory/ai-explanation";

function formatNaira(amount: number): string {
  return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(
    amount,
  );
}

function RecommendationCard({ recommendation }: { recommendation: RecommendedPropertyDTO }) {
  const { property, reasonTags } = recommendation;
  const explanation = useRecommendationExplanation(property.id);
  return (
    <Card>
      <CardHeader>
        <CardDescription>{property.location.address}</CardDescription>
        <CardTitle>{property.name}</CardTitle>
        <CardDescription>{formatNaira(property.pricePerPlot)} per plot</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {reasonTags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {reasonTags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-[#5C4033]/10 px-3 py-1 text-xs font-medium text-[#5C4033]"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
        <AiExplanation
          title="Why this fits you"
          isLoading={explanation.isLoading}
          isError={explanation.isError}
          text={explanation.data?.text}
        />
        <Link to={`/properties/${property.id}`}>
          <Button>View property</Button>
        </Link>
      </CardContent>
    </Card>
  );
}

/** Matched land recommendations — the next action after completing the Home-Readiness Quiz (PRODUCT_SPEC §2 step 3). */
export function RecommendedPropertiesPage() {
  const navigate = useNavigate();
  const { data: recommendations, isLoading, isError } = useRecommendedProperties(true);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FFECE4] px-4 py-10 text-[#181818]/60">
        Finding your matched properties…
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-[#FFECE4] px-4 py-10">
        <div className="mx-auto max-w-xl text-center">
          <p className="mb-4 text-[#181818]/70">Complete the Home-Readiness Quiz to see matched properties.</p>
          <Button onClick={() => navigate("/quiz/home-readiness")}>Start the quiz</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFECE4] px-4 py-10">
      <div className="mx-auto flex max-w-3xl flex-col gap-6">
        <header>
          <p className="font-heading text-2xl font-semibold text-[#181818]">Recommended for you</p>
          <p className="text-sm text-[#181818]/60">
            Matched to your budget, preferred area, and buyer profile.
          </p>
        </header>

        {recommendations && recommendations.length > 0 ? (
          <div className="flex flex-col gap-4">
            {recommendations.map((recommendation) => (
              <RecommendationCard key={recommendation.property.id} recommendation={recommendation} />
            ))}
          </div>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>No close matches yet</CardTitle>
              <CardDescription>
                Retake the quiz with an updated budget or area to see more options.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => navigate("/quiz/home-readiness")}>Retake the quiz</Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
