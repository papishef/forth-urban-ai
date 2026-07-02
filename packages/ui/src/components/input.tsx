import * as React from "react";
import { cn } from "../lib/cn.js";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "flex h-11 w-full rounded-xl border border-[#5C4033]/20 bg-white px-4 text-sm text-[#181818] placeholder:text-[#181818]/40 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C4033] disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = "Input";
