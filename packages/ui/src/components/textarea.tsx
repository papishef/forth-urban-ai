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
          "flex min-h-[110px] w-full resize-y rounded-xl border border-white/50 bg-white/60 px-4 py-3 text-base text-[#181818] placeholder:text-[#181818]/50 backdrop-blur-sm transition-all duration-300 outline-none focus:outline-none focus:border-[#5C4033]/60 focus:bg-white/80 focus:backdrop-blur-xl focus:shadow-[0_0_0_3px_rgba(92,64,51,0.14),0_8px_32px_-6px_rgba(92,64,51,0.45)] shadow-sm hover:bg-white/80 disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        {...props}
      />
    </motion.div>
  ),
);
Textarea.displayName = "Textarea";
