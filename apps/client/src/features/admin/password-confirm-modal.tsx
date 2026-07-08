import * as React from "react";
import { motion } from "framer-motion";
import { Lock } from "lucide-react";
import { Button, Input, Label } from "@forth-urban/ui";
import { getErrorMessage } from "../../lib/api-error";

/**
 * Generic re-auth gate: confirms the caller's own password before a sensitive
 * admin action (user role/status change, property edit/deactivate/delete)
 * runs. Shared across admin pages so every destructive/sensitive action asks
 * for the same confirmation (AGENTS.md security defaults).
 */
export function PasswordConfirmModal({
  title,
  description,
  confirmLabel = "Confirm",
  onCancel,
  onConfirm,
}: {
  title: string;
  description: React.ReactNode;
  confirmLabel?: string;
  onCancel: () => void;
  onConfirm: (password: string) => Promise<void>;
}) {
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  async function handleConfirm(e: React.FormEvent) {
    e.preventDefault();
    if (!password) {
      setError("Enter your password to continue");
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      await onConfirm(password);
    } catch (err) {
      setError(getErrorMessage(err, "Incorrect password"));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#181818]/50 backdrop-blur-sm p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onCancel}
    >
      <motion.form
        onSubmit={handleConfirm}
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, y: 16, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: 0.97 }}
        transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1.0] }}
        className="w-full max-w-sm rounded-2xl border border-white/50 bg-white/95 p-6 shadow-2xl shadow-[#5C4033]/20 backdrop-blur-md"
      >
        <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-[#FFECE4]">
          <Lock className="h-5 w-5 text-[#5C4033]" />
        </div>
        <h2 className="font-heading text-lg font-semibold text-[#181818]">{title}</h2>
        <div className="mt-1.5 text-sm text-[#181818]/70">{description}</div>

        <div className="mt-5 space-y-1.5">
          <Label htmlFor="confirm-password">Your password</Label>
          <Input
            id="confirm-password"
            type="password"
            autoFocus
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError(null);
            }}
          />
          {error && <p className="text-sm font-medium text-red-600">{error}</p>}
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting} disabled={isSubmitting}>
            {confirmLabel}
          </Button>
        </div>
      </motion.form>
    </motion.div>
  );
}
