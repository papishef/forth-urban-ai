import { Link } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Building,
  TrendingUp,
  Calculator,
  Compass,
  FileCheck2,
  CalendarCheck,
  CheckCircle2,
  Users,
  Award,
  ChevronRight,
} from "lucide-react";
import { Button, Logo } from "@forth-urban/ui";
import { useAuth } from "../../../lib/auth-context";
import { resolveEngineCta } from "../../../lib/engine-cta";
import { useSeo } from "../../../lib/use-seo";
import { useBlogPosts } from "../marketing-api";

export function HomePage() {
  const { user, isAuthenticated } = useAuth();
  const { scrollY } = useScroll();
  const backgroundY = useTransform(scrollY, [0, 1000], ["0%", "40%"]);

  useSeo({
    title: "Verified Land & AI Consultation in Abuja",
    description:
      "Own prime real estate in Abuja with 100% verified FCDA titles, flexible installment plans, and algorithmic property advisory.",
  });

  const quizCta = resolveEngineCta(user, isAuthenticated, "quiz");
  const propertiesCta = resolveEngineCta(user, isAuthenticated, "properties");
  const calculatorCta = resolveEngineCta(user, isAuthenticated, "calculators");
  const inspectionCta = resolveEngineCta(user, isAuthenticated, "book-inspection");

  const { data: blogData } = useBlogPosts(1);
  const latestPosts = blogData?.items.slice(0, 3) || [];

  return (
    <div className="relative overflow-hidden">
      {/* --------------------------------------------------------------------- */}
      {/* 1. HERO SECTION (Liquid Glass + Dark Gradient Retaining Hero Style)   */}
      {/* --------------------------------------------------------------------- */}
      <section className="relative min-h-[92vh] flex items-center justify-center px-4 py-20 sm:px-6 lg:px-8 bg-gradient-to-b from-[#181818] via-[#2c1d17] to-[#5C4033] text-white overflow-hidden">
        {/* Dynamic Architectural Background Layer */}
        <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden mix-blend-luminosity opacity-40">
          <motion.div
            style={{ y: backgroundY }}
            className="absolute inset-0 scale-[1.15]"
          >
            <motion.img
              src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=2000"
              alt="Modern Architecture"
              className="w-full h-full object-cover origin-center"
              animate={{ rotate: 360, scale: [1, 1.05, 1] }}
              transition={{ duration: 180, ease: "linear", repeat: Infinity }}
            />
          </motion.div>
          <div className="absolute inset-0 bg-gradient-to-t from-[#181818] via-[#181818]/60 to-transparent" />
        </div>

        {/* Animated Background Orbs */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden z-0">
          <motion.div
            animate={{
              scale: [1, 1.25, 1],
              opacity: [0.25, 0.45, 0.25],
              x: [0, 50, 0],
              y: [0, -40, 0],
            }}
            transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -top-24 -left-24 h-[500px] w-[500px] rounded-full bg-gradient-to-br from-[#d4af37]/30 to-[#FFECE4]/10 blur-3xl"
          />
          <motion.div
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.2, 0.4, 0.2],
              x: [0, -60, 0],
              y: [0, 50, 0],
            }}
            transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -bottom-32 -right-32 h-[550px] w-[550px] rounded-full bg-gradient-to-tr from-[#5C4033]/60 to-[#d4af37]/25 blur-3xl"
          />
          {/* Subtle architectural grid pattern */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage:
                "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
              backgroundSize: "32px 32px",
            }}
          />
        </div>

        <div className="relative z-10 mx-auto max-w-5xl text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 backdrop-blur-md shadow-lg"
          >
            <span className="flex h-2 w-2 rounded-full bg-[#d4af37] animate-pulse" />
            <span className="font-heading text-xs font-semibold uppercase tracking-wider text-[#FFECE4]">
              Abuja’s Trusted AI Real Estate Advisory
            </span>
          </motion.div>

          {/* Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="font-heading text-4xl font-extrabold tracking-tight sm:text-6xl lg:text-7xl leading-[1.1]"
          >
            Own Real Estate That{" "}
            <span className="bg-gradient-to-r from-[#d4af37] via-[#FCE3D6] to-[#d4af37] bg-clip-text text-transparent">
              Grows in Value
            </span>
          </motion.h1>

          {/* Subheading */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="mx-auto mt-6 max-w-2xl text-base sm:text-lg lg:text-xl text-white/80 leading-relaxed font-normal"
          >
            Experience transparent Abuja land acquisition with guaranteed FCDA titles and AI precision.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
          >
            <Link to={quizCta.to} className="w-full sm:w-auto">
              <Button
                variant="premium"
                size="lg"
                className="w-full sm:w-auto rounded-full gap-2 text-base font-bold shadow-xl shadow-[#d4af37]/25 px-8 py-6"
              >
                <Sparkles className="h-5 w-5" />
                <span>{quizCta.label}</span>
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>

            <Link to="/services" className="w-full sm:w-auto">
              <Button
                variant="secondary"
                size="lg"
                className="w-full sm:w-auto rounded-full text-base font-semibold border-white/30 bg-white/10 hover:bg-white/20 text-white backdrop-blur-md px-8 py-6"
              >
                Explore Services
              </Button>
            </Link>
          </motion.div>

          {/* Trust Highlights Grid */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.45 }}
            className="mt-16 grid grid-cols-2 gap-4 text-left sm:grid-cols-4"
          >
            {[
              {
                icon: ShieldCheck,
                title: "100% Genuine Titles",
                desc: "FCDA R-of-O verified",
              },
              {
                icon: Building,
                title: "3+ Prime Estates",
                desc: "Guzape II & Kuje growth zones",
              },
              {
                icon: Calculator,
                title: "Flexible Financing",
                desc: "Custom installment plans",
              },
              {
                icon: TrendingUp,
                title: "Proven Appreciation",
                desc: "Strategic high-yield locations",
              },
            ].map((stat, i) => {
              const Icon = stat.icon;
              return (
                <div
                  key={i}
                  className="rounded-2xl liquid-glass-dark p-4 border border-white/15 backdrop-blur-xl transition hover:border-[#d4af37]/40"
                >
                  <Icon className="h-6 w-6 text-[#d4af37] mb-2" />
                  <div className="font-heading text-sm font-bold text-white">{stat.title}</div>
                  <div className="text-xs text-white/60 mt-0.5">{stat.desc}</div>
                </div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* --------------------------------------------------------------------- */}
      {/* 2. INTERACTIVE 4-STEP AI CONSULTATION INFOGRAPHIC                     */}
      {/* --------------------------------------------------------------------- */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 rounded-full bg-[#5C4033]/10 px-4 py-1.5 text-xs font-bold text-[#5C4033] uppercase tracking-wider mb-4">
            <Compass className="h-4 w-4" />
            Seamless Consultation Journey
          </div>
          <h2 className="font-heading text-3xl font-extrabold text-[#181818] sm:text-4xl">
            How the Forth Urban AI Property Advisor Works
          </h2>
          <p className="mt-4 text-base text-[#181818]/70">
            Eliminating uncertainty in Nigerian real estate. A completely transparent 4-step path from readiness assessment to verified land ownership.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              step: "01",
              title: "AI Readiness Quiz",
              desc: "Answer 8 targeted questions in under 3 minutes to calculate your exact buying readiness score and profile.",
              icon: Sparkles,
              cta: quizCta,
            },
            {
              step: "02",
              title: "Area & Land Matching",
              desc: "Our deterministic engine matches your budget, lifestyle, and timeline with verified Abuja estates.",
              icon: Compass,
              cta: propertiesCta,
            },
            {
              step: "03",
              title: "Transparent Calculators",
              desc: "Simulate monthly installments, preview all hidden legal/infrastructure costs, and model 5-year ROI projections.",
              icon: Calculator,
              cta: calculatorCta,
            },
            {
              step: "04",
              title: "Book Site Inspection",
              desc: "Schedule a guided physical or virtual site inspection with complete title documentation and dedicated advisor support.",
              icon: CalendarCheck,
              cta: inspectionCta,
            },
          ].map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="relative rounded-3xl liquid-glass-card p-6 flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-heading text-2xl font-extrabold text-[#5C4033]/40 group-hover:text-[#5C4033] transition">
                      {item.step}
                    </span>
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#5C4033]/10 text-[#5C4033] group-hover:bg-[#5C4033] group-hover:text-white transition-colors duration-300">
                      <Icon className="h-6 w-6" />
                    </div>
                  </div>
                  <h3 className="font-heading text-lg font-bold text-[#181818] mb-2">
                    {item.title}
                  </h3>
                  <p className="text-sm text-[#181818]/70 leading-relaxed">
                    {item.desc}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-[#5C4033]/10">
                  <Link
                    to={item.cta.to}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[#5C4033] group-hover:text-[#d4af37] transition"
                  >
                    <span>{item.cta.label}</span>
                    <ChevronRight className="h-4 w-4 transform group-hover:translate-x-1 transition" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* --------------------------------------------------------------------- */}
      {/* 3. CORE SERVICES HIGHLIGHT GRID                                      */}
      {/* --------------------------------------------------------------------- */}
      <section className="py-20 bg-gradient-to-b from-white/40 to-[#FFECE4] border-y border-[#5C4033]/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#5C4033]">
                Comprehensive Real Estate Solutions
              </span>
              <h2 className="font-heading text-3xl font-extrabold text-[#181818] sm:text-4xl mt-2">
                What We Offer at Forth Urban
              </h2>
            </div>
            <Link to="/services">
              <Button variant="secondary" size="md" className="gap-2">
                <span>View All 6 Services</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: "Land Sales & Acquisition",
                desc: "Verified serviced plots across Abuja's premium locations from Guzape II to Kuje, backed by genuine FCDA titles and zero boundary conflicts.",
                icon: Building,
                ctaIntent: "properties" as const,
              },
              {
                title: "Legal Documentation & Due Diligence",
                desc: "Complete transparency. We conduct comprehensive search reports, title authentication, and seamless legal transfer processing.",
                icon: FileCheck2,
                ctaIntent: "book-inspection" as const,
              },
              {
                title: "Flexible Installment Financing",
                desc: "Structured payment terms tailored to your cash flow, making land acquisition stress-free for first-time buyers and seasoned investors alike.",
                icon: Calculator,
                ctaIntent: "calculators" as const,
              },
            ].map((service, idx) => {
              const Icon = service.icon;
              const cta = resolveEngineCta(user, isAuthenticated, service.ctaIntent);
              return (
                <div
                  key={idx}
                  className="rounded-3xl liquid-glass p-8 flex flex-col justify-between hover:shadow-2xl transition duration-300"
                >
                  <div>
                    <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-[#5C4033] to-[#463026] text-white flex items-center justify-center mb-6 shadow-md shadow-[#5C4033]/20">
                      <Icon className="h-7 w-7" />
                    </div>
                    <h3 className="font-heading text-xl font-bold text-[#181818] mb-3">
                      {service.title}
                    </h3>
                    <p className="text-sm text-[#181818]/75 leading-relaxed">
                      {service.desc}
                    </p>
                  </div>
                  <div className="mt-8">
                    <Link to={cta.to}>
                      <Button variant="primary" size="md" className="w-full justify-center gap-2 !bg-[#5C4033]">
                        <span>{cta.label}</span>
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* --------------------------------------------------------------------- */}
      {/* 4. WHY CHOOSE FORTH URBAN (Trust & Value Proposition)                  */}
      {/* --------------------------------------------------------------------- */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-[#5C4033]/10 px-4 py-1.5 text-xs font-bold text-[#5C4033] uppercase tracking-wider mb-4">
              <Award className="h-4 w-4" />
              Why Forth Urban
            </div>
            <h2 className="font-heading text-3xl font-extrabold text-[#181818] sm:text-4xl leading-tight">
              Building Trust Through Verified Properties & Client-Centered Service
            </h2>
            <p className="mt-4 text-base text-[#181818]/70 leading-relaxed">
              At Forth Urban Limited, we bridge the gap between affordability and capital appreciation. Whether you’re building your dream residential home or building a generational portfolio, our commitment to transparency guarantees your peace of mind.
            </p>

            <div className="mt-8 space-y-4">
              {[
                {
                  title: "Genuine FCDA Land Titles",
                  desc: "Every property comes with verified Certificates of Occupancy or Rights of Occupancy. No empty promises.",
                },
                {
                  title: "Predictable, Flexible Payments",
                  desc: "Tailored 6 to 12-month installment schedules with transparent milestone allocations.",
                },
                {
                  title: "High-Growth Zones",
                  desc: "Carefully selected plots in areas with active government infrastructure developments and double-digit annual appreciation.",
                },
                {
                  title: "Dedicated Advisory Support",
                  desc: "Personalized guidance from your first inquiry through document handover and physical site pegging.",
                },
              ].map((point, idx) => (
                <div key={idx} className="flex items-start gap-3.5">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#5C4033] text-white mt-0.5">
                    <CheckCircle2 className="h-4 w-4 text-[#d4af37]" />
                  </div>
                  <div>
                    <h4 className="font-heading text-sm font-bold text-[#181818]">{point.title}</h4>
                    <p className="text-xs text-[#181818]/70 mt-0.5">{point.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-10">
              <Link to={quizCta.to}>
                <Button variant="premium" size="lg" className="rounded-full gap-2 shadow-lg">
                  <Sparkles className="h-4 w-4" />
                  <span>{quizCta.label}</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>

          {/* Right Visual Glass Card with Abuja Map/Property Infographic */}
          <div className="relative">
            <div className="liquid-glass rounded-3xl p-8 shadow-2xl relative z-10 border-white/80">
              <div className="flex items-center justify-between pb-6 border-b border-[#5C4033]/15">
                <div className="flex items-center gap-3">
                  <Logo className="h-7" />
                  <div>
                    <h4 className="font-heading text-sm font-bold text-[#181818]">Estate Portfolio</h4>
                    <span className="text-xs text-[#5C4033] font-medium">Abuja, Federal Capital Territory</span>
                  </div>
                </div>
                <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-800">
                  Verified Active
                </span>
              </div>

              <div className="py-6 space-y-4">
                <div className="rounded-2xl bg-white/70 p-4 border border-white/80 shadow-sm flex items-center justify-between">
                  <div>
                    <div className="font-heading font-bold text-sm text-[#181818]">Guzape II Prime Development</div>
                    <div className="text-xs text-[#181818]/60">Exclusive residential & investment plots</div>
                  </div>
                  <span className="text-xs font-bold text-[#5C4033] bg-[#FFECE4] px-2.5 py-1 rounded-lg">
                    R-of-O Ready
                  </span>
                </div>

                <div className="rounded-2xl bg-white/70 p-4 border border-white/80 shadow-sm flex items-center justify-between">
                  <div>
                    <div className="font-heading font-bold text-sm text-[#181818]">Kuje Modern Residency</div>
                    <div className="text-xs text-[#181818]/60">Affordable starter & family community</div>
                  </div>
                  <span className="text-xs font-bold text-[#5C4033] bg-[#FFECE4] px-2.5 py-1 rounded-lg">
                    Installment Plans
                  </span>
                </div>

                <div className="rounded-2xl bg-white/70 p-4 border border-white/80 shadow-sm flex items-center justify-between">
                  <div>
                    <div className="font-heading font-bold text-sm text-[#181818]">Airport Corridor Growth Estate</div>
                    <div className="text-xs text-[#181818]/60">High capital appreciation zone</div>
                  </div>
                  <span className="text-xs font-bold text-[#5C4033] bg-[#FFECE4] px-2.5 py-1 rounded-lg">
                    High Growth
                  </span>
                </div>
              </div>

              <div className="pt-4 border-t border-[#5C4033]/15 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-[#181818]/70">
                  <Users className="h-4 w-4 text-[#5C4033]" />
                  <span>Guided inspection visits available weekly</span>
                </div>
                <Link to={inspectionCta.to} className="text-xs font-bold text-[#5C4033] hover:underline">
                  Book Slot &rarr;
                </Link>
              </div>
            </div>

            {/* Glowing background accent behind card */}
            <div className="absolute -inset-4 bg-gradient-to-tr from-[#d4af37]/30 to-[#5C4033]/20 rounded-3xl blur-2xl -z-10" />
          </div>
        </div>
      </section>

      {/* --------------------------------------------------------------------- */}
      {/* 5. LATEST MARKET INSIGHTS / BLOG TEASER SECTION                       */}
      {/* --------------------------------------------------------------------- */}
      {latestPosts.length > 0 && (
        <section className="py-20 bg-white/40 border-t border-[#5C4033]/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#5C4033]">
                  Market Intelligence
                </span>
                <h2 className="font-heading text-3xl font-extrabold text-[#181818] mt-2">
                  Latest Insights & Property News
                </h2>
              </div>
              <Link to="/blog">
                <Button variant="secondary" size="md" className="gap-2">
                  <span>View All Articles</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {latestPosts.map((post) => (
                <Link
                  key={post.id}
                  to={`/blog/${post.slug}`}
                  className="group rounded-3xl liquid-glass overflow-hidden flex flex-col justify-between transition hover:-translate-y-1.5 duration-300"
                >
                  {post.coverImageUrl && (
                    <div className="h-48 w-full overflow-hidden bg-[#5C4033]">
                      <img
                        src={post.coverImageUrl}
                        alt={post.title}
                        className="h-full w-full object-cover group-hover:scale-105 transition duration-500"
                      />
                    </div>
                  )}
                  <div className="p-6 flex-1 flex flex-col justify-between">
                    <div>
                      <span className="inline-block rounded-full bg-[#5C4033]/10 px-3 py-1 text-xs font-bold text-[#5C4033] mb-3">
                        {post.category}
                      </span>
                      <h3 className="font-heading text-lg font-bold text-[#181818] group-hover:text-[#5C4033] transition line-clamp-2 mb-2">
                        {post.title}
                      </h3>
                      <p className="text-xs text-[#181818]/70 line-clamp-3 leading-relaxed">
                        {post.excerpt}
                      </p>
                    </div>

                    <div className="mt-6 flex items-center justify-between pt-4 border-t border-[#5C4033]/10 text-xs font-semibold text-[#5C4033]">
                      <span>Read Article</span>
                      <ArrowRight className="h-3.5 w-3.5 transform group-hover:translate-x-1 transition" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* 6. CONVERSION CTA BANNER                                              */}
      {/* --------------------------------------------------------------------- */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-[#181818] via-[#463026] to-[#5C4033] p-8 sm:p-14 text-white text-center shadow-2xl">
          <div className="relative z-10 max-w-3xl mx-auto">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-4 py-1 text-xs font-bold uppercase tracking-wider text-[#d4af37] border border-white/20 mb-6">
              <Sparkles className="h-3.5 w-3.5" />
              Take the Next Step Today
            </span>
            <h2 className="font-heading text-3xl sm:text-5xl font-extrabold leading-tight">
              Ready to Secure Your Abuja Land Portfolio?
            </h2>
            <p className="mt-6 text-base sm:text-lg text-white/80 leading-relaxed max-w-2xl mx-auto">
              Create your free profile, take the 3-minute readiness quiz, review matched plots with verified documentation, and book a physical site inspection.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to={quizCta.to} className="w-full sm:w-auto">
                <Button
                  variant="premium"
                  size="lg"
                  className="w-full sm:w-auto rounded-full gap-2 px-8 py-6 font-bold shadow-xl shadow-[#d4af37]/30"
                >
                  <Sparkles className="h-5 w-5" />
                  <span>{quizCta.label}</span>
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
              <Link to="/contact" className="w-full sm:w-auto">
                <Button
                  variant="secondary"
                  size="lg"
                  className="w-full sm:w-auto rounded-full bg-white/10 border-white/30 text-white hover:bg-white/20 px-8 py-6 font-semibold"
                >
                  Contact Our Advisors
                </Button>
              </Link>
            </div>
          </div>

          {/* Ambient Glow */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-[#d4af37]/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#FFECE4]/10 rounded-full blur-3xl pointer-events-none" />
        </div>
      </section>
    </div>
  );
}
