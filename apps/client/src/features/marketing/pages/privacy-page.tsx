import { Link } from "react-router-dom";
import { useSeo } from "../../../lib/use-seo";

export function PrivacyPage() {
  useSeo({
    title: "Privacy Policy",
    description: "Privacy Policy and data protection practices of Forth Urban Limited.",
  });

  return (
    <div className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
      <div className="rounded-3xl liquid-glass p-8 sm:p-12 shadow-xl border-white/80">
        <h1 className="font-heading text-3xl sm:text-4xl font-extrabold text-[#181818] mb-6">
          Privacy Policy
        </h1>
        <p className="text-xs text-[#181818]/60 mb-8 pb-4 border-b border-[#5C4033]/15">
          Last Updated: January 2026 • Forth Urban Limited (Abuja, Nigeria)
        </p>

        <div className="space-y-6 text-sm text-[#181818]/80 leading-relaxed">
          <section>
            <h2 className="font-heading text-lg font-bold text-[#181818] mb-2">1. Data We Collect</h2>
            <p>
              When you use our website, take the readiness quiz, subscribe to our newsletter, or submit contact requests, we collect your name, email address, phone number, and buyer preferences necessary to provide tailored real estate recommendations.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-lg font-bold text-[#181818] mb-2">2. How We Use Your Information</h2>
            <p>
              Your data is strictly utilized to:
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Calculate your customized home-readiness band and buyer persona</li>
              <li>Coordinate site inspections and title document review</li>
              <li>Deliver verified Abuja property market news (with double opt-in consent)</li>
              <li>Facilitate customer service and inquiry responses</li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading text-lg font-bold text-[#181818] mb-2">3. Data Security & Retention</h2>
            <p>
              We implement industry-standard encryption and security protocols to safeguard your personal details. We never sell or rent your personal contact information to third parties.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-lg font-bold text-[#181818] mb-2">4. Managing Your Subscriptions</h2>
            <p>
              You can unsubscribe from marketing communications at any time by clicking the unsubscribe link at the footer of any email, or by emailing us directly at{" "}
              <a href="mailto:info@forthurban.com" className="text-[#5C4033] font-bold underline">
                info@forthurban.com
              </a>.
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
