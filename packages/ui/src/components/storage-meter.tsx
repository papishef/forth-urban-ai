import * as React from "react";
import { motion } from "framer-motion";
import { ArrowUpRight, HardDrive, ShieldAlert } from "lucide-react";
import { Badge } from "./badge.js";
import { Button } from "./button.js";
import { Progress } from "./progress.js";
import { cn } from "../lib/cn.js";

export interface StorageMeterProps extends React.HTMLAttributes<HTMLDivElement> {
  status: {
    usedBytes: number;
    totalBytes: number;
    availableBytes: number;
    usagePercent: number;
    planId: string;
    planLabel: string;
    status: string;
    autoRenew: boolean;
    currentPeriodEnd: string | null;
    isOverQuota: boolean;
  };
  compact?: boolean;
  onUpgrade?: () => void;
}

export function formatStorageSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(0, Math.round(bytes / 1024))} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(bytes >= 10 * 1024 * 1024 ? 0 : 1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(bytes >= 10 * 1024 * 1024 * 1024 ? 0 : 1)} GB`;
}

export const StorageMeter = React.forwardRef<HTMLDivElement, StorageMeterProps>(
  ({ status, compact = false, onUpgrade, className, ...props }, ref) => {
    const isWarning = status.usagePercent >= 80;
    const isCritical = status.isOverQuota || status.usagePercent >= 95;
    const fillClass = isCritical ? "bg-red-600" : isWarning ? "bg-amber-500" : "bg-[#5C4033]";
    const periodEnd = status.currentPeriodEnd
      ? new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" }).format(
          new Date(status.currentPeriodEnd),
        )
      : null;

    return (
      <div
        ref={ref}
        className={cn(
          compact
            ? "rounded-2xl border border-[#5C4033]/10 bg-white/55 p-3"
            : "rounded-3xl border border-white/70 bg-white/55 p-4 shadow-sm shadow-[#5C4033]/10 sm:p-5",
          className,
        )}
        {...props}
      >
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className={cn("flex shrink-0 items-center justify-center rounded-xl", compact ? "h-8 w-8" : "h-10 w-10", isCritical ? "bg-red-100 text-red-700" : "bg-[#FFECE4] text-[#5C4033]") }>
              {isCritical ? <ShieldAlert className="h-4 w-4" /> : <HardDrive className="h-4 w-4" />}
            </span>
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold uppercase tracking-[0.12em] text-[#181818]/50">Storage</p>
              <p className={cn("truncate font-semibold text-[#181818]", compact ? "text-sm" : "text-base")}>{status.planLabel} plan</p>
            </div>
          </div>
          <Badge variant={isCritical ? "outline" : status.planId === "free" ? "default" : "premium"} className={cn(isCritical && "border-red-200 text-red-700")}>
            {isCritical ? "Action needed" : status.planId === "free" ? "Starter allowance" : "Active"}
          </Badge>
        </div>

        <div className={cn("mt-4", compact && "mt-3")}>
          <div className="mb-2 flex items-end justify-between gap-3 text-xs">
            <span className="font-medium text-[#181818]/70">
              {formatStorageSize(status.usedBytes)} <span className="text-[#181818]/40">/ {formatStorageSize(status.totalBytes)}</span>
            </span>
            <span className={cn("font-semibold", isCritical ? "text-red-700" : isWarning ? "text-amber-700" : "text-[#5C4033]")}>
              {Math.round(status.usagePercent)}%
            </span>
          </div>
          <Progress value={status.usagePercent} indicatorClassName={fillClass} className="h-2.5 bg-[#5C4033]/10" />
          <div className="mt-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-[11px] text-[#181818]/55">
            <span>{formatStorageSize(status.availableBytes)} available</span>
            {periodEnd && <span>Renews {periodEnd}</span>}
            {status.status === "past_due" && <span className="font-semibold text-red-700">Renewal needs attention</span>}
          </div>
        </div>

        {onUpgrade && (
          <Button type="button" variant="secondary" size={compact ? "sm" : "md"} onClick={onUpgrade} className="mt-3 w-full justify-center gap-1.5 border-[#5C4033]/20 bg-white/80 text-[#5C4033]">
            {status.planId === "free" ? "Upgrade storage" : "Change storage plan"}
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Button>
        )}
        </motion.div>
      </div>
    );
  },
);
StorageMeter.displayName = "StorageMeter";