import { useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { newsletterSubscribeSchema, type NewsletterSubscribeInput } from "@forth-urban/validation";
import { Phone, Mail, MapPin, Clock, ArrowRight, CheckCircle2, Sparkles, ShieldCheck } from "lucide-react";
import { Button, Input, Logo } from "@forth-urban/ui";
import { useSubscribeNewsletter } from "../marketing-api";
import { useAuth } from "../../../lib/auth-context";
import { resolveEngineCta } from "../../../lib/engine-cta";

export function MarketingFooter({ compact = false }: { compact?: boolean }) {
  const { user, isAuthenticated } = useAuth();
  const [subscribeSuccess, setSubscribeSuccess] = useState(false);
  const subscribeMutation = useSubscribeNewsletter();
  const quizCta = resolveEngineCta(user, isAuthenticated, "quiz");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<NewsletterSubscribeInput>({
    resolver: zodResolver(newsletterSubscribeSchema),
  });

  const onSubscribe = handleSubmit(async (data) => {
    try {
      await subscribeMutation.mutateAsync(data);
      setSubscribeSuccess(true);
      reset();
    } catch {
      // Handled via mutation state or error toast
    }
  });

  return (
    <footer className={`relative ${compact ? "mt-0" : "mt-24"} border-t border-[#5C4033]/20 bg-[#181818] text-white`}>
      {/* Subtle top glowing bar */}
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-[#d4af37] to-transparent opacity-60" />

      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-5">
          {/* Col 1 & 2: Brand, Purpose & Contact Details */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            <Link to="/" className="inline-block">
              <Logo variant="white" className="h-9" />
            </Link>
            <p className="text-sm leading-relaxed text-white/70 max-w-sm">
              Forth Urban Limited makes land ownership and real estate investment in Abuja secure, transparent, and rewarding with verified FCDA titles and AI-powered consultation.
            </p>

            <div className="flex flex-col gap-3 text-sm text-white/80">
              <a
                href="tel:+2349111658936"
                className="flex items-center gap-3 transition hover:text-[#d4af37]"
              >
                <Phone className="h-4 w-4 text-[#d4af37] shrink-0" />
                <span>+234 911 165 8936</span>
              </a>
              <a
                href="mailto:info@forthurban.com"
                className="flex items-center gap-3 transition hover:text-[#d4af37]"
              >
                <Mail className="h-4 w-4 text-[#d4af37] shrink-0" />
                <span>info@forthurban.com</span>
              </a>
              <div className="flex items-start gap-3 text-white/70">
                <MapPin className="h-4 w-4 text-[#d4af37] shrink-0 mt-0.5" />
                <span>19 Ali Baba Cres, Jabi, Abuja 900108, FCT, Nigeria</span>
              </div>
              <div className="flex items-center gap-3 text-white/60 text-xs">
                <Clock className="h-3.5 w-3.5 text-[#d4af37] shrink-0" />
                <span>Working Hours: Mon – Fri (08:00 – 17:00)</span>
              </div>
            </div>
          </div>

          {/* Col 3: Quick Navigation Links */}
          <div className="flex flex-col gap-4">
            <h4 className="font-heading text-sm font-bold uppercase tracking-wider text-[#d4af37]">
              Company
            </h4>
            <ul className="flex flex-col gap-2.5 text-sm text-white/75">
              <li>
                <Link to="/" className="transition hover:text-white">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/services" className="transition hover:text-white">
                  Our Services
                </Link>
              </li>
              <li>
                <Link to="/blog" className="transition hover:text-white">
                  Market Insights & News
                </Link>
              </li>
              <li>
                <Link to="/contact" className="transition hover:text-white">
                  Contact & Support
                </Link>
              </li>
              <li>
                <Link to={quizCta.to} className="transition hover:text-[#d4af37] flex items-center gap-1.5 font-medium">
                  <Sparkles className="h-3.5 w-3.5 text-[#d4af37]" />
                  {isAuthenticated ? quizCta.label : "AI Readiness Quiz"}
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Services */}
          <div className="flex flex-col gap-4">
            <h4 className="font-heading text-sm font-bold uppercase tracking-wider text-[#d4af37]">
              Services
            </h4>
            <ul className="flex flex-col gap-2.5 text-sm text-white/75">
              <li>
                <Link to="/services" className="transition hover:text-white">
                  Land Sales & Acquisition
                </Link>
              </li>
              <li>
                <Link to="/services" className="transition hover:text-white">
                  Legal Documentation & Due Diligence
                </Link>
              </li>
              <li>
                <Link to="/services" className="transition hover:text-white">
                  Flexible Financing Plans
                </Link>
              </li>
              <li>
                <Link to="/services" className="transition hover:text-white">
                  Property Development
                </Link>
              </li>
              <li>
                <Link to="/services" className="transition hover:text-white">
                  AI Real Estate Advisory
                </Link>
              </li>
              <li>
                <Link to="/services" className="transition hover:text-white">
                  Property Valuation & ROI
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 5: Newsletter Subscription Column */}
          <div className="flex flex-col gap-4">
            <h4 className="font-heading text-sm font-bold uppercase tracking-wider text-[#d4af37]">
              Stay Informed
            </h4>
            <p className="text-sm text-white/70 leading-relaxed">
              Subscribe to receive verified land updates, price growth trends, and exclusive Abuja property alerts.
            </p>

            {subscribeSuccess ? (
              <div className="rounded-2xl bg-white/10 p-4 border border-white/20 backdrop-blur-md">
                <div className="flex items-center gap-2 text-[#d4af37] font-semibold text-sm mb-1">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  Confirmation Email Sent!
                </div>
                <p className="text-xs text-white/80 leading-relaxed">
                  Please check your inbox and click the confirmation link to complete your subscription.
                </p>
              </div>
            ) : (
              <form onSubmit={onSubscribe} noValidate className="flex flex-col gap-2.5">
                {/* Honeypot field for bot protection */}
                <input
                  type="text"
                  tabIndex={-1}
                  autoComplete="off"
                  className="hidden"
                  {...register("websiteUrl")}
                />

                <div className="flex flex-col gap-1.5">
                  <Input
                    type="email"
                    placeholder="Enter your email"
                    className="bg-white/10 text-white placeholder:text-white/40 border-white/20 focus:border-[#d4af37] focus:ring-[#d4af37]"
                    {...register("email")}
                  />
                  {errors.email && (
                    <span className="text-xs text-red-400">{errors.email.message}</span>
                  )}
                </div>

                <Button
                  type="submit"
                  variant="premium"
                  size="md"
                  disabled={isSubmitting}
                  className="w-full justify-center gap-2 font-semibold shadow-md"
                >
                  <span>{isSubmitting ? "Subscribing..." : "Subscribe to Newsletter"}</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>

                {subscribeMutation.isError && (
                  <p className="text-xs text-red-400 mt-1">
                    Could not subscribe right now. Please try again later.
                  </p>
                )}

                <div className="flex items-center gap-1.5 text-[11px] text-white/50 mt-1">
                  <ShieldCheck className="h-3.5 w-3.5 text-[#d4af37]" />
                  <span>Double opt-in. Unsubscribe at any time.</span>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Bottom Bar: Copyright & Legal */}
        <div className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 sm:flex-row text-xs text-white/50">
          <p>© 2026 Forth Urban Limited. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link to="/terms" className="transition hover:text-white">
              Terms of Use
            </Link>
            <Link to="/privacy" className="transition hover:text-white">
              Privacy Policy
            </Link>
            <Link to="/contact" className="transition hover:text-white">
              Site Inspection
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
