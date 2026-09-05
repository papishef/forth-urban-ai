import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "../lib/cn.js";

export interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export function Dialog({ open, onClose, title, description, children, className }: DialogProps) {
  const panelRef = React.useRef<HTMLDivElement>(null);
  const titleId = React.useId();
  const descriptionId = React.useId();

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[70] flex items-center justify-center overflow-y-auto bg-[#181818]/55 p-4 backdrop-blur-sm sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) onClose();
          }}
        >
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={description ? descriptionId : undefined}
            tabIndex={-1}
            onKeyDown={(event: React.KeyboardEvent<HTMLDivElement>) => {
              if (event.key === "Escape") onClose();
            }}
            className={cn(
              "my-4 flex max-h-[calc(100vh-2rem)] w-full max-w-4xl flex-col overflow-hidden rounded-3xl border border-white/60 bg-[#FFECE4]/95 shadow-2xl shadow-[#5C4033]/30 backdrop-blur-xl sm:my-8 sm:max-h-[calc(100vh-4rem)]",
              className,
            )}
            initial={{ opacity: 0, y: 18, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.97 }}
            transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
          >
            <div className="flex items-start justify-between gap-4 border-b border-[#5C4033]/10 px-5 py-4 sm:px-7 sm:py-5">
              <div className="min-w-0">
                <h2 id={titleId} className="font-heading text-xl font-semibold text-[#181818] sm:text-2xl">
                  {title}
                </h2>
                {description && (
                  <p id={descriptionId} className="mt-1 max-w-2xl text-sm leading-relaxed text-[#181818]/65">
                    {description}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close dialog"
                className="shrink-0 rounded-full border border-[#5C4033]/15 bg-white/70 p-2 text-[#5C4033] transition hover:bg-white focus:outline-none focus:ring-2 focus:ring-[#5C4033]/30"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="min-h-0 overflow-y-auto px-5 py-5 sm:px-7 sm:py-7">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}