import { Link } from "react-router-dom";
import {
  Building2,
  FileCheck2,
  Calculator,
  Compass,
  TrendingUp,
  HardHat,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@forth-urban/ui";
import { useAuth } from "../../../lib/auth-context";
import { resolveEngineCta, type EngineCtaIntent } from "../../../lib/engine-cta";
import { useSeo } from "../../../lib/use-seo";

export function ServicesPage() {
  const { user, isAuthenticated } = useAuth();

  useSeo({
    title: "Comprehensive Real Estate & Land Acquisition Services in Abuja",
    description:
      "Explore Forth Urban's end-to-end real estate solutions: verified land sales, legal title documentation, flexible financing, property development, and AI valuation.",
  });

  const services: Array<{
    number: string;
    title: string;
    description: string;
    icon: typeof Building2;
    benefits: string[];
    intent: EngineCtaIntent;
  }> = [
    {
      number: "01",
      title: "Land Sales & Acquisition",
      description:
        "We specialize in verified serviced plots across Abuja's premium growth zones. Every property comes with genuine FCDA R-of-O and C-of-O titles, verified beacon coordinates, and zero community disputes. From Guzape II to Kuje, discover your ideal plot.",
      icon: Building2,
      benefits: [
        "FCDA verified documentation",
        "Clear demarcation & physical beacons",
        "Prime growth corridor locations",
      ],
      intent: "properties",
    },
    {
      number: "02",
      title: "Legal Documentation & Due Diligence",
      description:
        "Complete transparency in all transactions. We handle comprehensive title verification at AGIS (Abuja Geographic Information Systems), contract processing, and deed execution so your ownership is legally watertight.",
      icon: FileCheck2,
      benefits: [
        "AGIS title verification checks",
        "Deed of assignment preparation",
        "Zero hidden encumbrances or litigation",
      ],
      intent: "book-inspection",
    },
    {
      number: "03",
      title: "Flexible Financing & Installment Plans",
      description:
        "Structured installment options that align with your cash flow. Whether you're a first-time buyer or expanding your portfolio, our 6 to 12-month payment terms make genuine property acquisition stress-free.",
      icon: Calculator,
      benefits: [
        "Convenient 6-12 month installment schedules",
        "Low initial down-payment options",
        "No hidden compounding interest charges",
      ],
      intent: "calculators",
    },
    {
      number: "04",
      title: "Property & Residential Estate Development",
      description:
        "From architectural concept to full infrastructure completion, we build modern residential estates and serviced layouts. Featuring secure gated perimeters, dedicated transformer electrification, and standard drainage networks.",
      icon: HardHat,
      benefits: [
        "Integrated access roads and drainage",
        "Secured gated estate perimeters",
        "Modern architectural master planning",
      ],
      intent: "properties",
    },
    {
      number: "05",
      title: "AI Real Estate Advisory & Consultation",
      description:
        "Our proprietary AI Property Advisor and experienced consultants provide tailored recommendations based on your budget, timeline, and goals—backed by real-time Abuja market intelligence.",
      icon: Compass,
      benefits: [
        "Algorithmic home-readiness scoring",
        "Personalized buyer persona matching",
        "Actionable next-step consultation roadmaps",
      ],
      intent: "quiz",
    },
    {
      number: "06",
      title: "Property Valuation & ROI Analytics",
      description:
        "Make data-driven investment decisions with our professional property assessments. We calculate current fair market valuations, infrastructure appreciation trends, and 5-year capital gain models.",
      icon: TrendingUp,
      benefits: [
        "Conservative, moderate, and optimistic ROI models",
        "Historic Abuja growth rate comparisons",
        "Full transparent hidden cost breakdowns",
      ],
      intent: "calculators",
    },
  ];

  return (
    <div className="relative overflow-hidden py-16 sm:py-24">
      {/* Page Header */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-[#5C4033]/10 px-4 py-1.5 text-xs font-bold text-[#5C4033] uppercase tracking-wider mb-4">
          <ShieldCheck className="h-4 w-4" />
          End-to-End Property Solutions
        </div>
        <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-extrabold text-[#181818] tracking-tight">
          Our Comprehensive Services
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-base sm:text-lg text-[#181818]/75 leading-relaxed">
          From verified land discovery to title transfer and investment valuation, Forth Urban provides full-lifecycle real estate solutions tailored to the Abuja capital market.
        </p>
      </div>

      {/* Services List Grid */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-10">
          {services.map((service, idx) => {
            const Icon = service.icon;
            const cta = resolveEngineCta(user, isAuthenticated, service.intent);
            return (
              <div
                key={idx}
                className="rounded-3xl liquid-glass p-8 sm:p-10 flex flex-col justify-between hover:shadow-2xl transition duration-300 relative overflow-hidden group"
              >
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <span className="font-heading text-3xl font-black text-[#5C4033]/25 group-hover:text-[#5C4033]/40 transition">
                      {service.number}
                    </span>
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#5C4033] text-white shadow-md shadow-[#5C4033]/20">
                      <Icon className="h-7 w-7" />
                    </div>
                  </div>

                  <h2 className="font-heading text-2xl font-bold text-[#181818] mb-4">
                    {service.title}
                  </h2>

                  <p className="text-sm text-[#181818]/80 leading-relaxed mb-6">
                    {service.description}
                  </p>

                  <div className="space-y-2.5 pt-4 border-t border-[#5C4033]/10">
                    {service.benefits.map((benefit, bIdx) => (
                      <div key={bIdx} className="flex items-center gap-2.5 text-xs text-[#181818]/80 font-medium">
                        <CheckCircle2 className="h-4 w-4 text-[#d4af37] shrink-0" />
                        <span>{benefit}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-8 pt-6">
                  <Link to={cta.to} className="w-full">
                    <Button
                      variant="primary"
                      size="lg"
                      className="w-full justify-center gap-2 !bg-[#5C4033] hover:!bg-[#463026]"
                    >
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

      {/* Conversion Banner */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-24">
        <div className="liquid-glass-dark rounded-3xl p-8 sm:p-12 text-white text-center relative overflow-hidden">
          <div className="relative z-10 max-w-2xl mx-auto">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-[#d4af37] border border-white/20 mb-4">
              <Sparkles className="h-3.5 w-3.5" />
              Start Your Journey
            </span>
            <h2 className="font-heading text-3xl sm:text-4xl font-extrabold leading-tight">
              Unsure which service fits your situation?
            </h2>
            <p className="mt-4 text-sm sm:text-base text-white/80 leading-relaxed">
              Take the AI Readiness Quiz to receive an instant assessment of your purchasing readiness, affordability ratio, and custom land recommendations.
            </p>
            <div className="mt-8">
              <Link to={resolveEngineCta(user, isAuthenticated, "quiz").to}>
                <Button variant="premium" size="lg" className="rounded-full gap-2 px-8 font-bold shadow-xl">
                  <Sparkles className="h-4 w-4" />
                  <span>Take Free Readiness Quiz</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
