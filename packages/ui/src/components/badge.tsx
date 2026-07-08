import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../lib/cn.js";

/** Premium pill/chip — used for property feature highlights, match reasons, and other short tags. */
const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold shadow-sm backdrop-blur-md whitespace-nowrap",
  {
    variants: {
      variant: {
        default: "bg-white/80 border border-[#5C4033]/10 text-[#5C4033]",
        premium:
          "bg-gradient-to-br from-[#d4af37] to-[#b8972e] text-white border border-[#d4af37]/40 shadow-[#d4af37]/30",
        outline: "bg-white/60 border border-[#181818]/10 text-[#181818]/80",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(({ className, variant, ...props }, ref) => (
  <span ref={ref} className={cn(badgeVariants({ variant }), className)} {...props} />
));
Badge.displayName = "Badge";
