import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Sparkles, LayoutDashboard, ChevronRight } from "lucide-react";
import { Button, Logo, cn } from "@forth-urban/ui";
import { useAuth } from "../../../lib/auth-context";
import { resolveEngineCta } from "../../../lib/engine-cta";

const NAV_LINKS = [
  { to: "/", label: "Home" },
  { to: "/services", label: "Services" },
  { to: "/blog", label: "Insights & News" },
  { to: "/contact", label: "Contact" },
];

export function MarketingHeader() {
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const engineCta = resolveEngineCta(user, isAuthenticated, "start");

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full transition-all duration-300",
        scrolled
          ? "bg-[#FFECE4]/85 backdrop-blur-xl border-b border-[#5C4033]/15 shadow-sm py-3"
          : "bg-transparent py-5",
      )}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <Link
          to="/"
          onClick={() => setMobileMenuOpen(false)}
          className="flex items-center gap-2 transition-transform hover:scale-105"
        >
          <Logo className="h-8 sm:h-9" />
        </Link>

        {/* Desktop Navigation Links with Animated Sliding Pill */}
        <nav className="hidden md:flex items-center gap-1 rounded-full bg-white/50 backdrop-blur-md border border-white/70 p-1.5 shadow-sm relative">
          {NAV_LINKS.map((link) => {
            const isActive =
              link.to === "/"
                ? location.pathname === "/"
                : location.pathname.startsWith(link.to);
            return (
              <Link
                key={link.to}
                to={link.to}
                className={cn(
                  "relative rounded-full px-4 py-1.5 text-sm font-medium transition-colors duration-200 z-10",
                  isActive
                    ? "text-white"
                    : "text-[#181818]/75 hover:text-[#5C4033] hover:bg-white/40",
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="active-nav-pill-desktop"
                    className="absolute inset-0 rounded-full bg-[#5C4033] shadow-md -z-10"
                    transition={{
                      type: "spring",
                      stiffness: 380,
                      damping: 30,
                    }}
                  />
                )}
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Action Buttons (Auth & Funnel Engine CTAs) */}
        <div className="hidden md:flex items-center gap-3">
          {isAuthenticated ? (
            <Link to={engineCta.to}>
              <Button
                variant="primary"
                size="md"
                className="flex items-center gap-2 rounded-full !bg-[#5C4033] text-white hover:!bg-[#463026] shadow-md hover:shadow-lg transition-all"
              >
                <LayoutDashboard className="h-4 w-4" />
                <span>{engineCta.label}</span>
              </Button>
            </Link>
          ) : (
            <>
              <Link to="/login" className="text-sm font-semibold text-[#5C4033] hover:underline px-3 py-2">
                Sign In
              </Link>
              <Link to={engineCta.to}>
                <Button
                  variant="premium"
                  size="md"
                  className="flex items-center gap-2 rounded-full font-semibold shadow-lg shadow-[#d4af37]/20 hover:scale-[1.02] active:scale-[0.98] transition-transform"
                >
                  <Sparkles className="h-4 w-4" />
                  <span>{engineCta.label}</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </>
          )}
        </div>

        {/* Futuristic Animated Hamburger Button */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen((prev) => !prev)}
          className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-white/60 backdrop-blur-md border border-white/80 text-[#5C4033] md:hidden shadow-sm hover:bg-white transition-all overflow-hidden"
          aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileMenuOpen}
        >
          <div className="flex flex-col items-center justify-center w-5 h-5 relative">
            <motion.span
              animate={
                mobileMenuOpen
                  ? { rotate: 45, y: 6, width: "20px" }
                  : { rotate: 0, y: 0, width: "20px" }
              }
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="h-0.5 bg-[#5C4033] rounded-full absolute top-0 left-0 origin-center"
            />
            <motion.span
              animate={
                mobileMenuOpen
                  ? { opacity: 0, x: -10 }
                  : { opacity: 1, x: 0, width: "14px" }
              }
              transition={{ duration: 0.2 }}
              className="h-0.5 bg-[#5C4033] rounded-full absolute top-[6px] left-0"
            />
            <motion.span
              animate={
                mobileMenuOpen
                  ? { rotate: -45, y: -6, width: "20px" }
                  : { rotate: 0, y: 0, width: "20px" }
              }
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="h-0.5 bg-[#5C4033] rounded-full absolute top-[12px] left-0 origin-center"
            />
          </div>
        </button>
      </div>

      {/* Futuristic Animated Mobile Menu Dropdown */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 320, damping: 26 }}
            onClick={() => setMobileMenuOpen(false)}
            className="md:hidden px-4 pt-2 pb-6"
          >
            <div className="liquid-glass rounded-3xl p-6 shadow-2xl border border-white/70 backdrop-blur-2xl flex flex-col gap-4 relative overflow-hidden">
              {/* Subtle neon glow accent */}
              <div className="absolute -top-16 -right-16 w-36 h-36 bg-[#d4af37]/20 rounded-full blur-2xl pointer-events-none" />
              
              <nav className="flex flex-col gap-1.5 relative">
                {NAV_LINKS.map((link) => {
                  const isActive =
                    link.to === "/"
                      ? location.pathname === "/"
                      : location.pathname.startsWith(link.to);
                  return (
                    <Link
                      key={link.to}
                      to={link.to}
                      className={cn(
                        "relative flex items-center justify-between rounded-2xl px-4 py-3 text-base font-semibold transition-colors duration-200 z-10",
                        isActive
                          ? "text-white"
                          : "text-[#181818]/80 hover:bg-white/60 hover:text-[#5C4033]",
                      )}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="active-nav-pill-mobile"
                          className="absolute inset-0 rounded-2xl bg-[#5C4033] shadow-md -z-10"
                          transition={{
                            type: "spring",
                            stiffness: 380,
                            damping: 30,
                          }}
                        />
                      )}
                      <span>{link.label}</span>
                      <ChevronRight
                        className={cn(
                          "h-4 w-4 transition-transform",
                          isActive ? "text-white translate-x-1" : "text-[#5C4033]/40",
                        )}
                      />
                    </Link>
                  );
                })}
              </nav>

              <div className="mt-2 border-t border-[#5C4033]/15 pt-4 flex flex-col gap-3">
                {isAuthenticated ? (
                  <Link to={engineCta.to} className="w-full">
                    <Button
                      variant="primary"
                      size="lg"
                      className="w-full justify-center gap-2 !bg-[#5C4033] shadow-md"
                    >
                      <LayoutDashboard className="h-4 w-4" />
                      {engineCta.label}
                    </Button>
                  </Link>
                ) : (
                  <>
                    <Link to={engineCta.to} className="w-full">
                      <Button variant="premium" size="lg" className="w-full justify-center gap-2 shadow-lg shadow-[#d4af37]/20">
                        <Sparkles className="h-4 w-4" />
                        {engineCta.label}
                      </Button>
                    </Link>
                    <Link to="/login" className="w-full">
                      <Button variant="secondary" size="lg" className="w-full justify-center border-white/60 bg-white/70">
                        Sign In
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
