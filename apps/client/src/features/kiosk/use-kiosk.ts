import { createContext, useContext } from "react";
import type { KioskAuthSession, KioskSession, KioskFormData } from "./types.js";

export interface KioskContextType {
  session: KioskSession;
  auth: KioskAuthSession | null;
  updateFormData: (data: Partial<KioskFormData>) => void;
  goToStep: (step: KioskSession["currentStep"]) => void;
  setError: (error: string) => void;
  setSuccess: (message: string, logId: string) => void;
  reset: () => void;
  setType: (type: "staff" | "visitor") => void;
  login: (session: KioskAuthSession) => void;
  logout: () => void;
}

export const KioskContext = createContext<KioskContextType | undefined>(undefined);

export function useKiosk(): KioskContextType {
  const context = useContext(KioskContext);
  if (!context) {
    throw new Error("useKiosk must be used within KioskProvider");
  }
  return context;
}
