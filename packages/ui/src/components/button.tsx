import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../lib/cn.js";
import { motion, type HTMLMotionProps } from "framer-motion";
import { Loader2 } from "lucide-react";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium transition-all duration-300 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-75 relative overflow-hidden",
  {
    variants: {
      variant: {
        primary: "bg-[#5C4033] text-white shadow-lg shadow-[#5C4033]/20 hover:bg-[#4a3329] focus-visible:ring-[#5C4033]",
        secondary:
          "bg-white/60 backdrop-blur-sm text-[#181818] border border-[#5C4033]/20 shadow-sm hover:bg-white focus-visible:ring-[#5C4033]",
        ghost: "bg-transparent text-[#5C4033] hover:bg-[#FFECE4]/50 focus-visible:ring-[#5C4033]",
        link: "bg-transparent text-[#5C4033] underline-offset-4 hover:underline",
        premium: "bg-[#d4af37] text-white shadow-lg shadow-[#d4af37]/30 hover:bg-[#b8972e] focus-visible:ring-[#d4af37]",
      },
      size: {
        sm: "h-9 px-3 text-sm",
        md: "h-11 px-5",
        lg: "h-12 px-6 text-base",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

type OmittedMotionProps = "onAnimationStart" | "onDragStart" | "onDragEnd" | "onDrag" | "ref";

export interface ButtonProps
  extends Omit<HTMLMotionProps<"button">, OmittedMotionProps | "children">,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean;
  children?: React.ReactNode;
}

/** The brown "primary" button is the app's main CTA — it gets an attention-drawing pulse (matching the landing page's "Get started" button) unless disabled/loading or the caller overrides `animate`/`transition`. */
const PULSE_ANIMATE = {
  boxShadow: [
    "0px 0px 0px 0px rgba(92,64,51,0)",
    "0px 0px 20px 4px rgba(92,64,51,0.45)",
    "0px 0px 0px 0px rgba(92,64,51,0)",
  ],
};
const PULSE_TRANSITION = { repeat: Infinity, duration: 2.2, ease: "easeInOut" as const };

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, isLoading, children, disabled, animate, transition, ...props }, ref) => {
    const shouldPulse = (variant ?? "primary") === "primary" && !disabled && !isLoading && !animate;
    return (
      <motion.button
        ref={ref}
        whileHover={disabled || isLoading ? {} : { scale: 1.02 }}
        whileTap={disabled || isLoading ? {} : { scale: 0.98 }}
        animate={shouldPulse ? PULSE_ANIMATE : animate}
        transition={shouldPulse ? PULSE_TRANSITION : transition}
        className={cn(buttonVariants({ variant, size }), className)}
        disabled={disabled || isLoading}
        {...props}
      >
        <span className={cn("inline-flex items-center gap-2", isLoading && "opacity-0")}>{children}</span>
        {isLoading && (
          <span className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-current" />
          </span>
        )}
      </motion.button>
    );
  },
);
Button.displayName = "Button";
