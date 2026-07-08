import { motion } from "framer-motion";
import { cn } from "../lib/cn.js";

/**
 * Premium animated "rising skyline" loader — a set of towers that pulse
 * upward in a staggered wave, with a blinking beacon light on the tallest
 * tower. Used everywhere the app is waiting on a fetch (route guards, tab
 * switches, list/table refreshes) instead of a bare "Loading…" string.
 */
const TOWER_HEIGHTS = [45, 75, 100, 62, 88, 55];

const SIZE_CONFIG = {
  sm: { container: "h-8 gap-1", bar: "w-1.5", text: "text-xs", beacon: "h-1 w-1" },
  md: { container: "h-14 gap-1.5", bar: "w-2", text: "text-sm", beacon: "h-1.5 w-1.5" },
  lg: { container: "h-20 gap-2", bar: "w-3", text: "text-base", beacon: "h-2 w-2" },
} as const;

export interface BuildingLoaderProps {
  size?: keyof typeof SIZE_CONFIG;
  label?: string;
  className?: string;
}

export const BuildingLoader = ({ size = "md", label, className }: BuildingLoaderProps) => {
  const config = SIZE_CONFIG[size];

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn("flex flex-col items-center justify-center gap-3", className)}
    >
      <div className={cn("relative flex items-end", config.container)}>
        <motion.span
          className={cn("absolute -top-1 left-1/2 -translate-x-1/2 rounded-full bg-[#d4af37]", config.beacon)}
          animate={{ opacity: [1, 0.25, 1], scale: [1, 1.5, 1] }}
          transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
        />
        {TOWER_HEIGHTS.map((height, i) => (
          <motion.div
            key={i}
            className={cn(
              "rounded-t-sm bg-gradient-to-t from-[#5C4033] via-[#8a6a52] to-[#d4af37] shadow-[0_0_10px_rgba(212,175,55,0.45)]",
              config.bar,
            )}
            style={{ height: `${height}%`, transformOrigin: "bottom" }}
            initial={{ scaleY: 0.35, opacity: 0.55 }}
            animate={{ scaleY: [0.35, 1, 0.35], opacity: [0.55, 1, 0.55] }}
            transition={{ duration: 1.3, repeat: Infinity, ease: "easeInOut", delay: i * 0.11 }}
          />
        ))}
      </div>
      {label ? (
        <p className={cn("font-medium tracking-wide text-[#181818]/60", config.text)}>{label}</p>
      ) : (
        <span className="sr-only">Loading</span>
      )}
    </div>
  );
};
BuildingLoader.displayName = "BuildingLoader";
