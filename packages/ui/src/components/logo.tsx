import { cn } from "../lib/cn.js";

/** Small Forth Urban brand mark used in page headers (see AGENTS.md design tokens). */
export function Logo({ className, variant = "color" }: { className?: string; variant?: "color" | "white" }) {
  const src = variant === "white" ? "/FU-Logo%20white.webp" : "/FU-Logo.webp";
  return <img src={src} alt="Forth Urban" className={cn("h-8 w-auto", className)} />;
}
