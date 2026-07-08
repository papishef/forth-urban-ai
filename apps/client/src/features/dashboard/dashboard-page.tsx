import { Link } from "react-router-dom";
import { Button, MotionCard, CardContent, CardDescription, CardHeader, CardTitle, PageTransition, Logo } from "@forth-urban/ui";
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
    <PageTransition>
      <div className="min-h-screen bg-gradient-to-br from-[#FFECE4] to-[#fce3d6] px-4 py-8 pb-24 lg:py-12 relative overflow-hidden">
        
        {/* Animated background highlights */}
        <div className="absolute top-0 right-0 -m-32 h-[800px] w-[800px] rounded-full bg-white/40 blur-[100px] pointer-events-none" />
        <div className="absolute top-1/2 left-0 -ml-40 h-[600px] w-[600px] rounded-full bg-[#d4af37]/5 blur-[120px] pointer-events-none" />

        <div className="mx-auto flex max-w-4xl flex-col gap-8 relative z-10">
          <header className="flex items-center justify-between bg-white/30 backdrop-blur-md rounded-2xl p-4 shadow-sm border border-white/40 sticky top-4 z-20">
            <div className="gap-3">
              <Logo className="h-8" />
              <br />
              <div>
                <p className="text-sm font-medium text-[#181818]/70">Welcome back, {user?.firstName ?? "there"}.</p>
              </div>
            </div>
            <div className="flex items-center gap-3 lg:gap-4">
              <NotificationBell />
              <Button variant="secondary" size="sm" onClick={() => logout()} className="bg-white/60">
                Log out
              </Button>
            </div>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            <div className="col-span-1 md:col-span-8 flex flex-col gap-6">
              {!isLoading && profile && (
                <MotionCard className="!bg-[#5C4033] !border-none text-white shadow-xl shadow-[#5C4033]/20 relative overflow-hidden">
                   <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&q=80&w=1000')] opacity-10 mix-blend-overlay object-cover" />
                   <div className="absolute inset-0 bg-gradient-to-r from-[#5C4033]/90 to-transparent" />
                  <CardHeader className="relative z-10 pb-4">
                    <CardDescription className="text-white/70 tracking-widest uppercase text-xs font-semibold">Your readiness score</CardDescription>
                    <CardTitle className="text-5xl font-black font-heading mt-2">{profile.readinessScore}<span className="text-3xl text-white/50">/100</span></CardTitle>
                    <CardDescription className="text-white/90 text-base mt-1">Buyer profile: <span className="text-[#d4af37] font-semibold">{profile.buyerPersona}</span></CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-wrap gap-3 relative z-10 mt-2">
                    <Link to="/quiz/home-readiness/result">
                      <Button variant="secondary" className="border-none">View full result</Button>
                    </Link>
                    <Link to="/properties/recommended">
                      <Button variant="premium" className="shadow-none">View matched properties</Button>
                    </Link>
                  </CardContent>
                </MotionCard>
              )}

              <MotionCard>
                <CardHeader>
                  <CardTitle className="text-xl">Home-Readiness Quiz</CardTitle>
                  <CardDescription className="text-base text-[#181818]/70">
                    {profile
                      ? "Retake the quiz anytime your budget or plans change."
                      : "Answer a few questions to get your readiness score and matched properties."}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                  <div className="mt-2">
                    <Link to="/quiz/home-readiness">
                      <Button className="w-full sm:w-auto">{profile ? "Retake Readiness Quiz" : "Start Readiness Quiz"}</Button>
                    </Link>
                  </div>
                </CardContent>
              </MotionCard>
            </div>

            <div className="col-span-1 md:col-span-4 flex flex-col gap-6">
              <MotionCard className="bg-gradient-to-br from-white/80 to-white/40 border-white/50">
                <CardHeader>
                   <div className="h-10 w-10 rounded-full bg-[#FFECE4] flex items-center justify-center mb-3">
                     <span className="text-xl">📍</span>
                   </div>
                  <CardTitle className="text-lg leading-tight">Next recommended action</CardTitle>
                  <CardDescription className="text-sm pt-1">
                    {inspections.length > 0
                      ? "Your booked site inspections."
                      : "Ready to verify a property in person or virtually?"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                  {inspections.map((inspection) => (
                    <div
                      key={inspection.id}
                      className="flex items-center justify-between rounded-xl bg-white/60 border border-white p-3 shadow-sm backdrop-blur-sm"
                    >
                      <div className="flex flex-col gap-1">
                        <span className="text-sm font-semibold text-[#181818]">
                          {inspection.recommendedArea ?? "Selected property"}
                        </span>
                        <span className="text-xs text-[#181818]/60">
                           {inspection.preferredDate} at {inspection.preferredTime}
                        </span>
                      </div>
                      <div className={`px-2 py-1 rounded-full text-xs font-bold ${
                          inspection.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                          inspection.status === 'completed' ? 'bg-gray-100 text-gray-700' :
                          'bg-amber-100 text-amber-700'
                        }`}>
                        {INSPECTION_STATUS_LABELS[inspection.status] ?? inspection.status}
                      </div>
                    </div>
                  ))}
                  <Link to="/inspections/book">
                    <Button variant="secondary" className="w-full text-sm h-10 border-white">Book an inspection</Button>
                  </Link>
                </CardContent>
              </MotionCard>

              <MotionCard className="bg-gradient-to-br from-[#181818]/5 to-transparent border-white/30">
                <CardHeader>
                   <div className="h-10 w-10 rounded-full bg-white/60 flex items-center justify-center mb-3 shadow-sm">
                     <span className="text-xl">🗺️</span>
                   </div>
                  <CardTitle className="text-lg leading-tight">Not sure which area fits you?</CardTitle>
                  <CardDescription className="text-sm pt-1">Take the Best Abuja Area Quiz for a quick recommendation.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Link to="/quiz/area">
                    <Button variant="secondary" className="w-full text-sm h-10 border-white bg-white/50">Take the Area Quiz</Button>
                  </Link>
                </CardContent>
              </MotionCard>
            </div>

          </div>
        </div>
      </div>
    </PageTransition>
  );
}

