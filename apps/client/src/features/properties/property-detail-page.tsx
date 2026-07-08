import { Link, useNavigate, useParams } from "react-router-dom";
import { Badge, BuildingLoader, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Logo } from "@forth-urban/ui";
import { Sparkles } from "lucide-react";
import { trackClientEvent } from "../../lib/analytics";
import { usePropertyDetail } from "./properties-api";

function formatNaira(amount: number): string {
  return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(
    amount,
  );
}

const DEVELOPMENT_STATUS_LABELS: Record<string, string> = {
  serviced: "Serviced",
  developing: "Developing",
  planned: "Planned",
  completed: "Completed",
};

/** Property detail page — renders all media (PRODUCT_SPEC §7) and the next-best-action after viewing a property card (§6). */
export function PropertyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: result, isLoading, isError } = usePropertyDetail(id);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FFECE4] px-4 py-10">
        <BuildingLoader size="lg" label="Loading property…" />
      </div>
    );
  }

  if (isError || !result) {
    return (
      <div className="min-h-screen bg-[#FFECE4] px-4 py-10">
        <div className="mx-auto max-w-xl text-center">
          <p className="mb-4 text-[#181818]/70">We couldn't find that property.</p>
          <Button onClick={() => navigate("/properties/recommended")}>Back to recommendations</Button>
        </div>
      </div>
    );
  }

  const { property, nextAction } = result;

  return (
    <div className="min-h-screen bg-[#FFECE4] px-4 py-10">
      <div className="mx-auto flex max-w-3xl flex-col gap-6">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
            ← Back
          </Button>
          <Link to="/dashboard">
            <Logo className="h-7" />
          </Link>
        </div>
        {property.media.photos.length > 0 && (
          <img
            src={property.media.photos[0]}
            alt={property.name}
            className="h-64 w-full rounded-2xl object-cover"
          />
        )}

        <Card>
          <CardHeader>
            <CardDescription>{property.location.address}</CardDescription>
            <CardTitle className="text-2xl">{property.name}</CardTitle>
            <CardDescription>{formatNaira(property.pricePerPlot)} per plot</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 text-sm text-[#181818]/80">
            {property.features.length > 0 && (
              <div className="mb-2 flex flex-wrap gap-2">
                {property.features.map((feature) => (
                  <Badge key={feature} variant="premium">
                    <Sparkles className="h-3 w-3" />
                    {feature}
                  </Badge>
                ))}
              </div>
            )}
            <p>Plot sizes: {property.plotSizes.join(", ")}</p>
            <p>Title type: {property.titleType}</p>
            <p>Documentation status: {property.documentationStatus}</p>
            <p>Development status: {DEVELOPMENT_STATUS_LABELS[property.developmentStatus] ?? property.developmentStatus}</p>
            {property.location.landmarks.length > 0 && <p>Landmarks: {property.location.landmarks.join(", ")}</p>}
            <p>
              Inspection available:{" "}
              {[
                property.inspectionAvailability.physical && "Physical",
                property.inspectionAvailability.virtual && "Virtual",
              ]
                .filter(Boolean)
                .join(" & ") || "Not available"}
            </p>
            {property.description && (
              <p className="mt-2 whitespace-pre-line rounded-xl border border-white/50 bg-white/40 p-4 leading-relaxed text-[#181818]/80">
                {property.description}
              </p>
            )}
          </CardContent>
        </Card>

        {property.paymentPlans.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Payment plans</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 text-sm text-[#181818]/80">
              {property.paymentPlans.map((plan) => (
                <p key={plan.label}>
                  {plan.label}
                  {plan.minDownPaymentPercent != null ? ` — from ${plan.minDownPaymentPercent}% down` : ""}
                  {plan.maxDurationMonths != null ? `, up to ${plan.maxDurationMonths} months` : ""}
                </p>
              ))}
            </CardContent>
          </Card>
        )}

        {(property.media.googleMapsUrl || property.media.brochureUrl) && (
          <Card>
            <CardHeader>
              <CardTitle>Media & documents</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 text-sm">
              {property.media.googleMapsUrl && (
                <a
                  href={property.media.googleMapsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[#5C4033] underline"
                >
                  View on Google Maps
                </a>
              )}
              {property.media.brochureUrl && (
                <a
                  href={property.media.brochureUrl}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => trackClientEvent("report_downloaded", { propertyId: property.id })}
                  className="text-[#5C4033] underline"
                >
                  Download brochure
                </a>
              )}
            </CardContent>
          </Card>
        )}

        <Card className="border-2 border-[#5C4033]">
          <CardHeader>
            <CardDescription>Next recommended action</CardDescription>
            <CardTitle>{nextAction.action}</CardTitle>
            <CardDescription>{nextAction.reason}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate(`/calculators/budget/${property.id}`)}>Continue</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
