import { useState } from "react";
import type { KioskSessionDTO } from "@forth-urban/shared-types";
import { kioskFetch } from "./kiosk-api.js";
import { useKiosk } from "./use-kiosk.js";

interface KioskLoginResponse {
  message?: string;
  data?: KioskSessionDTO;
}

async function readResponse(response: Response): Promise<KioskLoginResponse> {
  const text = await response.text();
  if (!text.trim()) return {};
  try {
    return JSON.parse(text) as KioskLoginResponse;
  } catch {
    return {};
  }
}

export function KioskLoginScreen() {
  const { login } = useKiosk();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [durationHours, setDurationHours] = useState("8");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    const hours = Number(durationHours);
    if (!email.trim() || !password || !Number.isInteger(hours) || hours < 1 || hours > 24) {
      setError("Enter your email, kiosk password, and a duration from 1 to 24 hours.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await kioskFetch("/attendance/kiosk/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, durationHours: hours }),
      });
      const result = await readResponse(response);
      if (!response.ok || !result.data) {
        throw new Error(result.message || "Kiosk unlock failed");
      }
      login(result.data);
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "Kiosk unlock failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="kiosk-content-width w-full max-w-xl mx-auto">
      <div className="mb-8 text-center">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.28em] text-[#5C4033]/60">Attendance kiosk</p>
        <h2 className="text-4xl font-bold" style={{ color: "#5C4033", fontFamily: "'Manrope', sans-serif" }}>
          Unlock kiosk
        </h2>
        <p className="mt-3 text-base text-[#181818]/65">Use an owner or approved sub-admin account.</p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-5 rounded-2xl border border-[#5C4033]/15 bg-white/80 p-6 shadow-lg sm:p-8">
        <div>
          <label htmlFor="kiosk-email" className="mb-2 block text-sm font-semibold text-[#181818]">Email</label>
          <input
            id="kiosk-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="username"
            placeholder="owner@example.com"
            className="w-full rounded-lg border-2 border-[#DDD] bg-white p-4 text-lg"
            autoFocus
          />
        </div>

        <div>
          <label htmlFor="kiosk-password-input" className="mb-2 block text-sm font-semibold text-[#181818]">Kiosk password</label>
          <input
            id="kiosk-password-input"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            placeholder="Enter kiosk password"
            className="w-full rounded-lg border-2 border-[#DDD] bg-white p-4 text-lg"
          />
        </div>

        <div>
          <label htmlFor="kiosk-duration" className="mb-2 block text-sm font-semibold text-[#181818]">Keep kiosk unlocked for (hours)</label>
          <input
            id="kiosk-duration"
            type="number"
            min="1"
            max="24"
            step="1"
            value={durationHours}
            onChange={(event) => setDurationHours(event.target.value)}
            className="w-full rounded-lg border-2 border-[#DDD] bg-white p-4 text-lg"
          />
        </div>

        {error && <p role="alert" className="text-sm font-medium text-red-700">{error}</p>}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-lg p-4 text-lg font-semibold text-white transition-opacity disabled:cursor-wait disabled:opacity-60"
          style={{ backgroundColor: "#5C4033" }}
        >
          {isSubmitting ? "Unlocking…" : "Unlock kiosk"}
        </button>
      </form>
    </div>
  );
}