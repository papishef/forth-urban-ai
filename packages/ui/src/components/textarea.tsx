import * as React from "react";
import { cn } from "../lib/cn.js";
import { motion } from "framer-motion";

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, disabled, ...props }, ref) => (
    <motion.div className="relative w-full" whileTap={disabled ? {} : { scale: 0.995 }}>
      <textarea
        ref={ref}
        disabled={disabled}
        className={cn(
          "flex min-h-[110px] w-full resize-y rounded-xl border border-white/50 bg-white/60 px-4 py-3 text-sm text-[#181818] placeholder:text-[#181818]/50 backdrop-blur-sm transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C4033]/50 focus-visible:border-[#5C4033] focus-visible:bg-white shadow-sm hover:bg-white/80 disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        {...props}
      />
    </motion.div>
  ),
);
Textarea.displayName = "Textarea";
