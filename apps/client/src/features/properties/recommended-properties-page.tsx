import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Badge,
  Button,
  MotionCard,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  SkeletonGlass,
  PageTransition,
  Logo,
  cn,
} from "@forth-urban/ui";
import { Sparkles, ChevronLeft, ChevronRight, ImageOff } from "lucide-react";
import type { RecommendedPropertyDTO } from "@forth-urban/shared-types";
import { useRecommendedProperties } from "./properties-api";
import { useRecommendationExplanation } from "../ai-advisory/ai-advisory-api";
import { AiExplanation } from "../ai-advisory/ai-explanation";

function formatNaira(amount: number): string {
  return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(
    amount,
  );
}

/** Auto-rotating, swipeable photo gallery for a recommendation card's hero image. */
function PropertyImageGallery({ photos, name, matchLabel }: { photos: string[]; name: string; matchLabel: string }) {
  const [index, setIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (photos.length <= 1 || isPaused) return;
    const timer = setInterval(() => setIndex((current) => (current + 1) % photos.length), 4500);
    return () => clearInterval(timer);
  }, [photos.length, isPaused]);

  if (photos.length === 0) {
    return (
      <div className="relative flex h-56 w-full items-center justify-center overflow-hidden bg-gradient-to-br from-[#5C4033]/15 via-[#d4af37]/10 to-[#5C4033]/5 sm:h-64">
        <ImageOff className="h-9 w-9 text-[#5C4033]/25" aria-hidden="true" />
        <span className="absolute top-3 right-3 z-10 rounded-full bg-[#d4af37] px-2.5 py-1 text-xs font-bold text-white shadow-sm">
          {matchLabel}
        </span>
      </div>
    );
  }

  return (
    <div
      className="group/gallery relative h-56 w-full overflow-hidden bg-[#181818]/5 sm:h-64"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <AnimatePresence mode="wait">
        <motion.img
          key={photos[index]}
          src={photos[index]}
          alt={`${name} — photo ${index + 1} of ${photos.length}`}
          initial={{ opacity: 0, scale: 1.06 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="absolute inset-0 h-full w-full object-cover"
        />
      </AnimatePresence>

      {/* Gradient overlays for legibility of badges/controls */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-black/0 to-black/10" />

      <span className="absolute top-3 right-3 z-10 rounded-full bg-[#d4af37] px-2.5 py-1 text-xs font-bold text-white shadow-sm">
        {matchLabel}
      </span>

      {photos.length > 1 && (
        <>
          <span className="absolute top-3 left-3 z-10 rounded-full bg-black/40 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur-sm">
            {index + 1}/{photos.length}
          </span>

          <button
            type="button"
            aria-label="Previous photo"
            onClick={() => setIndex((current) => (current - 1 + photos.length) % photos.length)}
            className="absolute left-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/30 p-1.5 text-white opacity-0 backdrop-blur-sm transition-opacity duration-300 hover:bg-black/50 group-hover/gallery:opacity-100 focus-visible:opacity-100"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label="Next photo"
            onClick={() => setIndex((current) => (current + 1) % photos.length)}
            className="absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/30 p-1.5 text-white opacity-0 backdrop-blur-sm transition-opacity duration-300 hover:bg-black/50 group-hover/gallery:opacity-100 focus-visible:opacity-100"
          >
            <ChevronRight className="h-4 w-4" />
          </button>

          <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 gap-1.5">
            {photos.map((photo, photoIndex) => (
              <button
                key={photo}
                type="button"
                aria-label={`Show photo ${photoIndex + 1}`}
                onClick={() => setIndex(photoIndex)}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-300",
                  photoIndex === index ? "w-6 bg-white" : "w-1.5 bg-white/50 hover:bg-white/70",
                )}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function RecommendationCard({ recommendation, index }: { recommendation: RecommendedPropertyDTO; index: number }) {
  const { property, reasonTags } = recommendation;
  const explanation = useRecommendationExplanation(property.id);
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
    >
      <MotionCard className="overflow-hidden border border-white/50 bg-white/60 group">
        <PropertyImageGallery photos={property.photos} name={property.name} matchLabel={`${(index + 1) * 9}% Match`} />
        <CardHeader className="relative pb-6 border-b border-[#5C4033]/5">
          <CardDescription className="text-xs tracking-wider uppercase font-semibold text-[#5C4033]/60 mb-1">{property.location.address}</CardDescription>
          <CardTitle className="text-2xl group-hover:text-[#5C4033] transition-colors">{property.name}</CardTitle>
          <CardDescription className="text-lg font-bold text-[#181818] mt-2">{formatNaira(property.pricePerPlot)} per plot</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-5 pt-6 bg-gradient-to-b from-white/30 to-transparent">
          {property.features.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {property.features.map((feature) => (
                <Badge key={feature} variant="premium">
                  <Sparkles className="h-3 w-3" />
                  {feature}
                </Badge>
              ))}
            </div>
          )}
          {reasonTags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {reasonTags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-white/80 border border-[#5C4033]/10 px-3 py-1 text-xs font-semibold text-[#5C4033] shadow-sm backdrop-blur-md"
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
          <Link to={`/properties/${property.id}`} className="mt-2 block w-full sm:w-auto">
            <Button size="lg" className="w-full sm:w-auto shadow-[#5C4033]/10 hover:shadow-lg">View property calculation</Button>
          </Link>
        </CardContent>
      </MotionCard>
    </motion.div>
  );
}

/** Matched land recommendations — the next action after completing the Home-Readiness Quiz (PRODUCT_SPEC §2 step 3). */
export function RecommendedPropertiesPage() {
  const navigate = useNavigate();
  const { data: recommendations, isLoading, isError } = useRecommendedProperties(true);

  if (isLoading) {
    return (
      <PageTransition>
        <div className="flex flex-col min-h-screen bg-gradient-to-br from-[#FFECE4] to-[#fce3d6] px-4 py-12 gap-6 items-center">
          <div className="flex flex-col gap-2 mb-4 w-full max-w-3xl">
             <SkeletonGlass className="h-8 max-w-[250px]" />
             <SkeletonGlass className="h-4 max-w-[400px]" />
          </div>
          <div className="w-full max-w-3xl flex flex-col gap-6">
            <SkeletonGlass className="w-full h-72" />
            <SkeletonGlass className="w-full h-72" />
          </div>
        </div>
      </PageTransition>
    );
  }

  if (isError) {
    return (
      <PageTransition>
        <div className="min-h-screen bg-gradient-to-br from-[#FFECE4] to-[#fce3d6] flex items-center justify-center px-4 py-10">
          <MotionCard className="mx-auto max-w-xl text-center p-8 bg-white/80">
            <h2 className="mb-4 text-2xl font-bold font-heading">Missing Profile Data</h2>
            <p className="mb-8 text-[#181818]/70">Complete the Home-Readiness Quiz to allow the AI to match you with valid properties.</p>
            <Button size="lg" className="w-full" onClick={() => navigate("/quiz/home-readiness")}>Start the quiz</Button>
          </MotionCard>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-gradient-to-br from-[#FFECE4] to-[#fce3d6] px-4 py-12 relative overflow-hidden">
        
        {/* Dynamic Backgrounds */}
        <div className="absolute top-0 right-0 -m-32 h-[500px] w-[500px] rounded-full bg-[#d4af37]/10 blur-[100px] pointer-events-none mix-blend-multiply" />

        <div className="mx-auto flex max-w-3xl flex-col gap-8 relative z-10">
          <motion.header 
             initial={{ opacity: 0, y: -20 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ duration: 0.5 }}
             className="bg-white/40 backdrop-blur-md rounded-2xl p-6 border border-white/50 shadow-sm relative"
          >
            <Link to="/dashboard" className="mb-3 inline-block">
              <Logo className="h-7" />
            </Link>
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="absolute top-2 right-2 text-[#181818]/60 hover:text-[#181818]">
              ← Back
            </Button>
            <p className="font-heading text-3xl font-extrabold text-[#181818] mb-1 pr-16">Recommended for you</p>
            <p className="text-base text-[#181818]/70 font-medium tracking-tight">
              Matched strictly to your budget, preferred area, and buyer profile based on your readiness score.
            </p>
          </motion.header>

          <AnimatePresence>
            {recommendations && recommendations.length > 0 ? (
              <div className="flex flex-col gap-6">
                {recommendations.map((recommendation, i) => (
                  <RecommendationCard key={recommendation.property.id} recommendation={recommendation} index={i} />
                ))}
              </div>
            ) : (
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
                <MotionCard className="text-center p-8 bg-white/80">
                  <CardHeader>
                    <CardTitle className="text-xl">No close matches yet</CardTitle>
                    <CardDescription className="text-base mt-2">
                      Retake the quiz with an updated budget or area to see more options, or contact our advisory team directly.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col sm:flex-row justify-center gap-4">
                    <Button onClick={() => navigate("/quiz/home-readiness")} className="w-full sm:w-auto">Retake the quiz</Button>
                    <Button variant="secondary" onClick={() => navigate("/dashboard")} className="w-full sm:w-auto">Back to Dashboard</Button>
                  </CardContent>
                </MotionCard>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </PageTransition>
  );
}
