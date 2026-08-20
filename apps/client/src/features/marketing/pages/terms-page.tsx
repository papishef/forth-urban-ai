import { Link } from "react-router-dom";
import { useSeo } from "../../../lib/use-seo";

export function TermsPage() {
  useSeo({
    title: "Terms of Use",
    description: "Terms of Use and client service agreements for Forth Urban Limited.",
  });

  return (
    <div className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
      <div className="rounded-3xl liquid-glass p-8 sm:p-12 shadow-xl border-white/80">
        <h1 className="font-heading text-3xl sm:text-4xl font-extrabold text-[#181818] mb-6">
          Terms of Use
        </h1>
        <p className="text-xs text-[#181818]/60 mb-8 pb-4 border-b border-[#5C4033]/15">
          Last Updated: January 2026 • Forth Urban Limited
        </p>

        <div className="space-y-6 text-sm text-[#181818]/80 leading-relaxed">
          <section>
            <h2 className="font-heading text-lg font-bold text-[#181818] mb-2">1. Acceptance of Terms</h2>
            <p>
              By accessing and using the Forth Urban website and AI Property Advisory Platform, you agree to comply with and be bound by these Terms of Use and our Privacy Policy.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-lg font-bold text-[#181818] mb-2">2. Property Information & Availability</h2>
            <p>
              All property descriptions, survey maps, coordinates, pricing, and availability displayed on this platform are subject to confirmation and contract. Forth Urban Limited conducts thorough title verification through official land registries (such as AGIS).
            </p>
          </section>

          <section>
            <h2 className="font-heading text-lg font-bold text-[#181818] mb-2">3. Algorithmic Advisory & Financial Calculators</h2>
            <p>
              The AI Property Advisor readiness score and ROI/budget calculators are informational decision-support tools. Financial and capital appreciation projections do not constitute a guarantee of future performance.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-lg font-bold text-[#181818] mb-2">4. Contact & Inquiries</h2>
            <p>
              For legal inquiries regarding our terms or property documentation, please contact our legal team at{" "}
              <a href="mailto:info@forthurban.com" className="text-[#5C4033] font-bold underline">
                info@forthurban.com
              </a>{" "}
              or visit our office at 19 Ali Baba Cres, Jabi, Abuja.
            </p>
          </section>
        </div>

        <div className="mt-10 pt-6 border-t border-[#5C4033]/15">
          <Link to="/" className="text-xs font-bold text-[#5C4033] hover:underline">
            &larr; Return to Homepage
          </Link>
        </div>
      </div>
    </div>
  );
}
