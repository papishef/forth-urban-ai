import { useEffect, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { Button, Logo } from "@forth-urban/ui";
import { KioskProvider, useKiosk } from "./kiosk-context.js";
import { CheckInScreen } from "./check-in.js";
import { CheckOutScreen } from "./check-out.js";
import { SuccessScreen } from "./success-screen.js";
import { WelcomeScreen } from "./welcome-screen.js";

/**
 * Main kiosk layout — tablet-optimized, full-screen, no navigation
 * 
 * Color scheme:
 * - Background: #FFECE4
 * - Primary: #5C4033 (brown)
 * - Text: #181818
 * - Icons: Lucide
 * 
 * Font:
 * - Headings: Manrope (24px)
 * - Body: Inter (16px)
 * - Buttons: Inter (18px)
 */
function KioskContent() {
  const { session, reset } = useKiosk();
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  // Auto-reset after success (3 seconds)
  useEffect(() => {
    if (session.currentStep === "success") {
      const timer = setTimeout(() => {
        reset();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [session.currentStep, reset]);

  return (
    <div className="kiosk-shell" style={{ fontFamily: "'Inter', sans-serif" }}>
      <div className="kiosk-grid" aria-hidden="true" />
      <div className="kiosk-scanline" aria-hidden="true" />
      <FingerprintBackground />
      {/* Header with logo and time */}
      <header className="kiosk-header">
        <Logo className="kiosk-logo h-9 sm:h-10" />
        <div className="kiosk-clock" aria-label={`Current time ${now.toLocaleTimeString()}`}>
          <div className="kiosk-clock-face" aria-hidden="true">
            <span className="kiosk-clock-hand kiosk-clock-hour" style={{ transform: `translateX(-50%) rotate(${(now.getHours() % 12) * 30 + now.getMinutes() / 2}deg)` }} />
            <span className="kiosk-clock-hand kiosk-clock-minute" style={{ transform: `translateX(-50%) rotate(${now.getMinutes() * 6}deg)` }} />
            <span className="kiosk-clock-hand kiosk-clock-second" style={{ transform: `translateX(-50%) rotate(${now.getSeconds() * 6}deg)` }} />
            <span className="kiosk-clock-pin" />
          </div>
          <span className="kiosk-clock-time">
            {now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
          </span>
          <span className="kiosk-clock-date">
            {now.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
          </span>
        </div>
      </header>

      {/* Main content area */}
      <main className="kiosk-stage">
        <div className="kiosk-status" aria-hidden="true">
          <span className="kiosk-status-dot" /> SYSTEM ONLINE <span>///</span> BIOMETRIC GATE
        </div>
        <div className="kiosk-glass-panel">
          {session.currentStep !== "welcome" && session.currentStep !== "success" && session.currentStep !== "error" && (
            <Button
              variant="ghost"
              size="sm"
              onClick={reset}
              className="kiosk-back-button text-[#181818]/60 hover:text-[#181818]"
            >
              ← Back
            </Button>
          )}
          {session.currentStep === "welcome" && <WelcomeScreen />}
          {session.currentStep === "type-select" && <CheckInScreen />}
          {session.currentStep === "staff-lookup" && <CheckInScreen />}
          {session.currentStep === "check-out" && <CheckOutScreen />}
          {session.currentStep === "visitor-info" && <CheckInScreen />}
          {session.currentStep === "inspection-link" && <CheckInScreen />}
          {session.currentStep === "assign-rep" && <CheckInScreen />}
          {session.currentStep === "success" && <SuccessScreen />}
          {session.currentStep === "error" && <ErrorScreen />}
        </div>
      </main>

      <footer className="kiosk-footer">
        <ShieldCheck className="h-4 w-4" aria-hidden="true" />
        <span>Secure visitor access</span>
        <span className="kiosk-footer-divider" aria-hidden="true" />
        <span>Please speak to our receptionist if you need assistance</span>
      </footer>
    </div>
  );
}

function FingerprintBackground() {
  const fingerprintPaths = [
    "M208 394c-36-28-58-72-58-124 0-84 68-152 152-152s152 68 152 152c0 52-22 96-58 124",
    "M180 370c-27-27-43-62-43-100 0-91 74-165 165-165s165 74 165 165c0 38-16 73-43 100",
    "M237 427c-43-29-71-78-71-133 0-75 61-136 136-136s136 61 136 136c0 55-28 104-71 133",
    "M269 446c-27-34-43-76-43-122 0-42 34-76 76-76s76 34 76 76c0 46-16 88-43 122",
    "M300 458c-14-27-22-57-22-89 0-14 11-25 24-25s24 11 24 25c0 32-8 62-22 89",
    "M115 264c0-103 84-187 187-187s187 84 187 187",
    "M128 318c-10-19-15-41-15-64 0-105 85-190 190-190s190 85 190 190c0 23-5 45-15 64",
  ];

  return (
    <div className="kiosk-fingerprint" aria-hidden="true">
      <div className="kiosk-fingerprint-ring kiosk-fingerprint-ring-one" />
      <div className="kiosk-fingerprint-ring kiosk-fingerprint-ring-two" />
      <svg viewBox="0 0 600 520" role="presentation">
        {fingerprintPaths.map((path, index) => (
          <path key={path} d={path} className={`fingerprint-line fingerprint-line-${index + 1}`} />
        ))}
      </svg>
    </div>
  );
}

function ErrorScreen() {
  const { session, reset } = useKiosk();

  return (
    <div className="kiosk-content-width w-full max-w-2xl mx-auto text-center">
      <div className="mb-6 text-6xl">⚠️</div>
      <h2 className="text-3xl font-bold mb-4" style={{ color: "#5C4033", fontFamily: "'Manrope', sans-serif" }}>
        Error
      </h2>
      <p className="text-lg mb-8" style={{ color: "#181818" }}>
        {session.error || "An error occurred. Please try again."}
      </p>
      <button
        onClick={reset}
        className="px-12 py-4 rounded-lg font-semibold text-white text-lg transition-all"
        style={{
          backgroundColor: "#5C4033",
          minWidth: "180px",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.opacity = "0.9";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.opacity = "1";
        }}
      >
        Try Again
      </button>
    </div>
  );
}

export function KioskShell() {
  return (
    <KioskProvider>
      <KioskContent />
    </KioskProvider>
  );
}
