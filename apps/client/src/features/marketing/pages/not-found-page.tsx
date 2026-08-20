import { Link } from "react-router-dom";
import { Compass, ArrowRight } from "lucide-react";
import { Button } from "@forth-urban/ui";
import { useSeo } from "../../../lib/use-seo";

export function NotFoundPage() {
  useSeo({
    title: "Page Not Found",
    description: "The page you're looking for doesn't exist or may have moved.",
  });

  return (
    <div className="py-24 px-4 sm:px-6 lg:px-8 max-w-xl mx-auto text-center">
      <div className="rounded-3xl liquid-glass p-8 sm:p-12 shadow-2xl border-white/80">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#5C4033]/10 text-[#5C4033] mb-4">
          <Compass className="h-8 w-8" />
        </div>
        <h1 className="font-heading text-3xl font-extrabold text-[#181818] mb-2">
          404 — Page Not Found
        </h1>
        <p className="text-sm text-[#181818]/70 mb-8 leading-relaxed">
          The page you're looking for doesn't exist or may have moved. Let's get you back on track.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link to="/" className="w-full sm:w-auto">
            <Button variant="primary" size="md" className="w-full !bg-[#5C4033] gap-2">
              <span>Return to Home</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link to="/contact" className="w-full sm:w-auto">
            <Button variant="secondary" size="md" className="w-full">
              Contact Us
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
