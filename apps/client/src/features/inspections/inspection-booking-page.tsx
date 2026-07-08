import { useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { inspectionBookingInputSchema, type InspectionBookingInput } from "@forth-urban/validation";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Label, Logo } from "@forth-urban/ui";
import { useAuth } from "../../lib/auth-context";
import { trackClientEvent } from "../../lib/analytics";
import { useBookInspection } from "./inspections-api";

const MAIN_CONCERN_OPTIONS = [
  { value: "scamFear", label: "Fear of being scammed" },
  { value: "documentation", label: "Documentation & title concerns" },
  { value: "hiddenCosts", label: "Hidden costs" },
  { value: "locationConfusion", label: "Not sure which area fits" },
  { value: "delayedAllocation", label: "Delayed allocation" },
  { value: "affordability", label: "Affordability" },
] as const;

/** Site Inspection Scheduler booking form (PRODUCT_SPEC §11 — the funnel's conversion event). */
export function InspectionBookingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const propertyId = searchParams.get("propertyId") ?? undefined;
  const recommendedArea = searchParams.get("area") ?? undefined;
  const bookInspection = useBookInspection();

  useEffect(() => {
    trackClientEvent("inspection_started", { propertyId, recommendedArea });
  }, [propertyId, recommendedArea]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<InspectionBookingInput>({
    resolver: zodResolver(inspectionBookingInputSchema),
    defaultValues: {
      propertyId,
      recommendedArea,
      inspectionType: "physical",
      preferredDate: "",
      preferredTime: "",
      mainConcern: "hiddenCosts",
      wantsDocsBeforeInspection: false,
      whatsappNumber: user?.whatsappNumber ?? undefined,
    },
  });

  async function onSubmit(values: InspectionBookingInput) {
    await bookInspection.mutateAsync(values);
  }

  const result = bookInspection.data;

  if (result) {
    return (
      <div className="min-h-screen bg-[#FFECE4] px-4 py-10">
        <div className="mx-auto flex max-w-xl flex-col gap-6">
          <Link to="/dashboard">
            <Logo className="h-7" />
          </Link>
          <Card>
            <CardHeader>
              <CardDescription>Inspection booked</CardDescription>
              <CardTitle className="text-2xl">We&apos;ve got your request</CardTitle>
              <CardDescription>
                {result.inspectionType === "physical" ? "Physical" : "Virtual"} inspection on {result.preferredDate}{" "}
                at {result.preferredTime}.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <div>
                <p className="mb-2 text-sm font-medium text-[#181818]">Your inspection checklist</p>
                <ul className="list-inside list-disc text-sm text-[#181818]/80">
                  {result.checklist.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
              <a
                href={result.whatsappLink}
                target="_blank"
                rel="noreferrer"
                onClick={() => trackClientEvent("whatsapp_clicked", { context: "inspection_confirmation" })}
              >
                <Button variant="secondary" className="w-full">
                  Message us on WhatsApp
                </Button>
              </a>
            </CardContent>
          </Card>

          <Card className="border-2 border-[#5C4033]">
            <CardHeader>
              <CardDescription>Next recommended action</CardDescription>
              <CardTitle>{result.nextAction.action}</CardTitle>
              <CardDescription>{result.nextAction.reason}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => navigate("/dashboard")}>Go to dashboard</Button>
            </CardContent>
          </Card>
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
        <header>
          <p className="font-heading text-2xl font-semibold text-[#181818]">Book an inspection</p>
          <p className="text-sm text-[#181818]/60">
            {propertyId
              ? "For the land you've been reviewing."
              : recommendedArea
                ? `For your recommended area: ${recommendedArea}.`
                : "Tell us how you'd like to verify the land."}
          </p>
        </header>

        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
              <input type="hidden" {...register("propertyId")} />

              {!propertyId && (
                <div>
                  <Label htmlFor="recommendedArea">Recommended area</Label>
                  <Input id="recommendedArea" {...register("recommendedArea")} />
                  {errors.recommendedArea && (
                    <p className="text-sm text-red-600">{errors.recommendedArea.message}</p>
                  )}
                </div>
              )}

              <div>
                <Label>Inspection type</Label>
                <div className="mt-2 flex gap-4">
                  <label className="flex items-center gap-2 text-sm text-[#181818]">
                    <input type="radio" value="physical" {...register("inspectionType")} />
                    Physical
                  </label>
                  <label className="flex items-center gap-2 text-sm text-[#181818]">
                    <input type="radio" value="virtual" {...register("inspectionType")} />
                    Virtual
                  </label>
                </div>
              </div>

              <div>
                <Label htmlFor="preferredDate">Preferred date</Label>
                <Input id="preferredDate" type="date" {...register("preferredDate")} />
                {errors.preferredDate && <p className="text-sm text-red-600">{errors.preferredDate.message}</p>}
              </div>

              <div>
                <Label htmlFor="preferredTime">Preferred time</Label>
                <Input id="preferredTime" type="time" {...register("preferredTime")} />
                {errors.preferredTime && <p className="text-sm text-red-600">{errors.preferredTime.message}</p>}
              </div>

              <div>
                <Label htmlFor="mainConcern">What&apos;s your biggest concern?</Label>
                <select
                  id="mainConcern"
                  {...register("mainConcern")}
                  className="w-full rounded-md border border-[#181818]/20 bg-white px-3 py-2 text-sm text-[#181818]"
                >
                  {MAIN_CONCERN_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <label className="flex items-center gap-2 text-sm text-[#181818]">
                <input type="checkbox" {...register("wantsDocsBeforeInspection")} />
                Send me the property documents before the inspection
              </label>

              {!user?.whatsappNumber && (
                <div>
                  <Label htmlFor="whatsappNumber">WhatsApp number</Label>
                  <Input id="whatsappNumber" placeholder="+234..." {...register("whatsappNumber")} />
                  {errors.whatsappNumber && (
                    <p className="text-sm text-red-600">{errors.whatsappNumber.message}</p>
                  )}
                </div>
              )}

              {errors.propertyId && !propertyId && (
                <p className="text-sm text-red-600">{errors.propertyId.message}</p>
              )}

              {bookInspection.isError && (
                <p className="text-sm text-red-600">Something went wrong. Please try again.</p>
              )}

              <Button type="submit" disabled={bookInspection.isPending}>
                {bookInspection.isPending ? "Booking…" : "Book inspection"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
