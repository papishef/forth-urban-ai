import { useParams, Link } from "react-router-dom";
import { CheckCircle2, XCircle, ArrowRight } from "lucide-react";
import { BuildingLoader, Button } from "@forth-urban/ui";
import { useConfirmNewsletter } from "../marketing-api";
import { useSeo } from "../../../lib/use-seo";

export function NewsletterConfirmPage() {
  const { token } = useParams<{ token: string }>();
  const { data, isLoading, isError } = useConfirmNewsletter(token);

  useSeo({
    title: "Newsletter Subscription Confirmation",
    description: "Confirm your Forth Urban newsletter subscription for Abuja real estate updates.",
  });

  return (
    <div className="py-24 px-4 sm:px-6 lg:px-8 max-w-xl mx-auto text-center">
      <div className="rounded-3xl liquid-glass p-8 sm:p-12 shadow-2xl border-white/80">
        {isLoading ? (
          <BuildingLoader size="md" label="Confirming your subscription…" className="py-8" />
        ) : isError || !data ? (
          <div>
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-red-600 mb-4">
              <XCircle className="h-8 w-8" />
            </div>
            <h1 className="font-heading text-2xl font-bold text-[#181818] mb-2">
              Invalid or Expired Link
            </h1>
            <p className="text-sm text-[#181818]/70 mb-8 leading-relaxed">
              This confirmation link may have already been used or has expired. Please try signing up again via the footer on our homepage.
            </p>
            <Link to="/">
              <Button variant="primary" size="md" className="!bg-[#5C4033]">
                Return to Home
              </Button>
            </Link>
          </div>
        ) : (
          <div>
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#5C4033] text-white mb-4">
              <CheckCircle2 className="h-8 w-8 text-[#d4af37]" />
            </div>
            <h1 className="font-heading text-2xl font-bold text-[#181818] mb-2">
              Subscription Confirmed!
            </h1>
            <p className="text-sm text-[#181818]/80 mb-8 leading-relaxed">
              Welcome to the Forth Urban community. You’ll now receive timely updates on Abuja property developments, investment analyses, and new verified plot releases.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link to="/blog" className="w-full sm:w-auto">
                <Button variant="primary" size="md" className="w-full !bg-[#5C4033] gap-2">
                  <span>Browse Latest Articles</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/" className="w-full sm:w-auto">
                <Button variant="secondary" size="md" className="w-full">
                  Return to Home
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
