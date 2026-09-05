import React, { useCallback, useReducer } from "react";
import type { KioskSession, KioskFormData } from "./types.js";
import { KioskContext } from "./use-kiosk.js";

interface KioskContextType {
  session: KioskSession;
  updateFormData: (data: Partial<KioskFormData>) => void;
  goToStep: (step: KioskSession["currentStep"]) => void;
  setError: (error: string) => void;
  setSuccess: (message: string, logId: string) => void;
  reset: () => void;
  setType: (type: "staff" | "visitor") => void;
}

const initialSession: KioskSession = {
  currentStep: "welcome",
  formData: {},
};

type KioskAction =
  | { type: "UPDATE_FORM"; payload: Partial<KioskFormData> }
  | { type: "GO_TO_STEP"; payload: KioskSession["currentStep"] }
  | { type: "SET_ERROR"; payload: string }
  | { type: "SET_SUCCESS"; payload: { message: string; logId: string } }
  | { type: "SET_TYPE"; payload: "staff" | "visitor" }
  | { type: "RESET" };

function kioskReducer(state: KioskSession, action: KioskAction): KioskSession {
  switch (action.type) {
    case "UPDATE_FORM":
      return {
        ...state,
        formData: { ...state.formData, ...action.payload },
      };
    case "GO_TO_STEP":
      return {
        ...state,
        currentStep: action.payload,
        error: undefined,
      };
    case "SET_ERROR":
      return {
        ...state,
        currentStep: "error",
        error: action.payload,
      };
    case "SET_SUCCESS":
      return {
        ...state,
        currentStep: "success",
        successMessage: action.payload.message,
        lastSubmittedLogId: action.payload.logId,
      };
    case "SET_TYPE":
      return {
        ...state,
        selectedType: action.payload,
        formData: { ...state.formData, type: action.payload },
      };
    case "RESET":
      return initialSession;
    default:
      return state;
  }
}

export function KioskProvider({ children }: { children: React.ReactNode }) {
  const [session, dispatch] = useReducer(kioskReducer, initialSession);

  const updateFormData = useCallback((data: Partial<KioskFormData>) => {
    dispatch({ type: "UPDATE_FORM", payload: data });
  }, []);

  const goToStep = useCallback((step: KioskSession["currentStep"]) => {
    dispatch({ type: "GO_TO_STEP", payload: step });
  }, []);

  const setError = useCallback((error: string) => {
    dispatch({ type: "SET_ERROR", payload: error });
  }, []);

  const setSuccess = useCallback((message: string, logId: string) => {
    dispatch({ type: "SET_SUCCESS", payload: { message, logId } });
  }, []);

  const reset = useCallback(() => {
    dispatch({ type: "RESET" });
  }, []);

  const setType = useCallback((type: "staff" | "visitor") => {
    dispatch({ type: "SET_TYPE", payload: type });
  }, []);

  const value: KioskContextType = {
    session,
    updateFormData,
    goToStep,
    setError,
    setSuccess,
    reset,
    setType,
  };

  return <KioskContext.Provider value={value}>{children}</KioskContext.Provider>;
}
