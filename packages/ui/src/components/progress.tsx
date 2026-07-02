import * as React from "react";
import { cn } from "../lib/cn.js";

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Current progress, 0-100. */
  value: number;
}

export const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ value, className, ...props }, ref) => {
    const clamped = Math.min(100, Math.max(0, value));
    return (
      <div
        ref={ref}
        role="progressbar"
        aria-valuenow={Math.round(clamped)}
        aria-valuemin={0}
        aria-valuemax={100}
        className={cn("h-2 w-full overflow-hidden rounded-full bg-[#5C4033]/10", className)}
        {...props}
      >
        <div
          className="h-full rounded-full bg-[#5C4033] transition-all duration-300"
          style={{ width: `${clamped}%` }}
        />
      </div>
    );
  },
);
Progress.displayName = "Progress";
