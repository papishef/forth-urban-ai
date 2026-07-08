import * as React from "react";
import { cn } from "../lib/cn.js";
import { motion, type HTMLMotionProps } from "framer-motion";

export const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "rounded-2xl border border-white/40 bg-white/40 backdrop-blur-md shadow-xl shadow-[#5C4033]/5 transition-all duration-300 hover:shadow-[#5C4033]/10 overflow-hidden",
        className,
      )}
      {...props}
    />
  ),
);
Card.displayName = "Card";

export const MotionCard = React.forwardRef<HTMLDivElement, HTMLMotionProps<"div">>(
  ({ className, ...props }, ref) => (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1.0] }}
      whileHover={{ y: -4, shadow: "0 20px 25px -5px rgba(92, 64, 51, 0.1), 0 8px 10px -6px rgba(92, 64, 51, 0.1)" }}
      className={cn(
        "rounded-2xl border border-white/40 bg-white/40 backdrop-blur-md shadow-xl shadow-[#5C4033]/5 overflow-hidden will-change-transform",
        className,
      )}
      {...props}
    />
  ),
);
MotionCard.displayName = "MotionCard";

export const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div ref={ref} className={cn("p-6 pb-3 relative z-10", className)} {...props} />,
);
CardHeader.displayName = "CardHeader";

export const CardTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3 ref={ref} className={cn("font-heading text-xl font-bold bg-clip-text text-transparent bg-gradient-to-br from-[#181818] to-[#5C4033]", className)} {...props} />
  ),
);
CardTitle.displayName = "CardTitle";

export const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn("text-sm text-[#181818]/60", className)} {...props} />
  ),
);
CardDescription.displayName = "CardDescription";

export const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />,
);
CardContent.displayName = "CardContent";
