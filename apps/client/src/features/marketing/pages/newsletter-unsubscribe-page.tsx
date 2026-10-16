import { useParams, Link } from "react-router-dom";
import { CheckCircle2, XCircle, ArrowRight } from "lucide-react";
import { BuildingLoader, Button } from "@forth-urban/ui";
import { useUnsubscribeNewsletter } from "../marketing-api";
import { useSeo } from "../../../lib/use-seo";

export function NewsletterUnsubscribePage() {
  const { token } = useParams<{ token: string }>();
  const { data, isLoading, isError } = useUnsubscribeNewsletter(token);

  useSeo({
    title: "Newsletter Unsubscribed",
    description: "Manage your Forth Urban newsletter subscription preferences.",
  });

  return (
    <div className="py-24 px-4 sm:px-6 lg:px-8 max-w-xl mx-auto text-center">
      <div className="rounded-3xl liquid-glass p-8 sm:p-12 shadow-2xl border-white/80">
        {isLoading ? (
          <BuildingLoader size="md" label="Processing your request…" className="py-8" />
        ) : isError || !data ? (
          <div>
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-red-600 mb-4">
              <XCircle className="h-8 w-8" />
            </div>
            <h1 className="font-heading text-2xl font-bold text-[#181818] mb-2">
              Invalid Unsubscribe Link
            </h1>
            <p className="text-sm text-[#181818]/70 mb-8 leading-relaxed">
              This link may be malformed or the subscription no longer exists. If you keep receiving emails, please contact us directly.
            </p>
            <Link to="/contact">
              <Button variant="primary" size="md" className="!bg-[#5C4033]">
                Contact Support
              </Button>
            </Link>
          </div>
        ) : (
          <div>
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#5C4033] text-white mb-4">
              <CheckCircle2 className="h-8 w-8 text-[#d4af37]" />
            </div>
            <h1 className="font-heading text-2xl font-bold text-[#181818] mb-2">
              You've Been Unsubscribed
            </h1>
            <p className="text-sm text-[#181818]/80 mb-8 leading-relaxed">
              You will no longer receive Forth Urban market insights or property announcements. You can resubscribe at any time from our homepage footer.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link to="/" className="w-full sm:w-auto">
                <Button variant="primary" size="md" className="w-full !bg-[#5C4033] gap-2">
                  <span>Return to Home</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
