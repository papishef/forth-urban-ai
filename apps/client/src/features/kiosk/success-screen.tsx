import { useEffect } from "react";
import { CheckCircle2 } from "lucide-react";
import { useKiosk } from "./kiosk-context.js";

export function SuccessScreen() {
  const { session, reset } = useKiosk();

  useEffect(() => {
    const timer = setTimeout(() => {
      reset();
    }, 3000);

    return () => clearTimeout(timer);
  }, [reset]);

  return (
    <div className="kiosk-content-width mx-auto w-full max-w-2xl px-1 text-center sm:px-4">
      <div className="mb-6 animate-bounce">
        <CheckCircle2 size={120} style={{ color: "#5C4033", margin: "0 auto" }} />
      </div>

      <h2 className="text-4xl font-bold mb-4" style={{ color: "#5C4033", fontFamily: "'Manrope', sans-serif" }}>
        Success!
      </h2>

      <p className="text-xl mb-8" style={{ color: "#181818" }}>
        {session.successMessage || "You have been checked in successfully"}
      </p>

      <p className="text-sm" style={{ color: "#999" }}>
        This screen will reset automatically in a few seconds...
      </p>
    </div>
  );
}
