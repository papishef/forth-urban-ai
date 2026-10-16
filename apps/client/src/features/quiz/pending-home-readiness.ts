import { homeReadinessAnswersSchema, type HomeReadinessAnswers } from "@forth-urban/validation";

const PENDING_HOME_READINESS_KEY = "forth-urban.pending-home-readiness";
const PENDING_HOME_READINESS_PROGRESS_KEY = "forth-urban.pending-home-readiness-progress";
const PENDING_HOME_READINESS_AUTH_KEY = "forth-urban.pending-home-readiness-auth";
const PENDING_QUIZ_SESSION_KEY = "forth-urban.pending-home-readiness-session";
const PENDING_HOME_READINESS_VERSION = 1;
const PENDING_HOME_READINESS_MAX_AGE_MS = 24 * 60 * 60 * 1000;

interface PendingHomeReadinessDraft {
  version: number;
  savedAt: number;
  answers: unknown;
}

export interface HomeReadinessProgress {
  stepIndex: number;
  answers: HomeReadinessProgressAnswers;
}

export type HomeReadinessProgressAnswers = {
  buyerGoal?: HomeReadinessAnswers["buyerGoal"];
  budgetRange?: Partial<HomeReadinessAnswers["budgetRange"]>;
  monthlyIncome?: HomeReadinessAnswers["monthlyIncome"];
  paymentStyle?: HomeReadinessAnswers["paymentStyle"];
  timeline?: HomeReadinessAnswers["timeline"];
  preferredArea?: HomeReadinessAnswers["preferredArea"];
  lifestylePreference?: HomeReadinessAnswers["lifestylePreference"];
  biggestFear?: HomeReadinessAnswers["biggestFear"];
  inspectionPreference?: HomeReadinessAnswers["inspectionPreference"];
};

function getSessionStorage(): Storage | null {
  if (typeof window === "undefined") return null;

  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

function getLocalStorage(): Storage | null {
  if (typeof window === "undefined") return null;

  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function savePendingHomeReadinessQuiz(answers: HomeReadinessAnswers): boolean {
  const parsed = homeReadinessAnswersSchema.safeParse(answers);
  const localStorage = getLocalStorage();
  const sessionStorage = getSessionStorage();
  if (!parsed.success || (!localStorage && !sessionStorage)) return false;

  const serialized = JSON.stringify({
    version: PENDING_HOME_READINESS_VERSION,
    savedAt: Date.now(),
    answers: parsed.data,
  } satisfies PendingHomeReadinessDraft);

  try {
    if (localStorage) {
      localStorage.setItem(PENDING_HOME_READINESS_KEY, serialized);
      sessionStorage?.removeItem(PENDING_HOME_READINESS_KEY);
    } else {
      sessionStorage!.setItem(PENDING_HOME_READINESS_KEY, serialized);
    }
    sessionStorage?.removeItem(PENDING_HOME_READINESS_PROGRESS_KEY);
    localStorage?.removeItem(PENDING_HOME_READINESS_AUTH_KEY);
    sessionStorage?.removeItem(PENDING_HOME_READINESS_AUTH_KEY);
    return true;
  } catch {
    if (localStorage && sessionStorage) {
      try {
        sessionStorage.setItem(PENDING_HOME_READINESS_KEY, serialized);
        sessionStorage.removeItem(PENDING_HOME_READINESS_PROGRESS_KEY);
        sessionStorage.removeItem(PENDING_HOME_READINESS_AUTH_KEY);
        return true;
      } catch {
        return false;
      }
    }
    return false;
  }
}

export function getPendingHomeReadinessQuiz(): HomeReadinessAnswers | null {
  for (const storage of [getLocalStorage(), getSessionStorage()]) {
    if (!storage) continue;

    try {
      const raw = storage.getItem(PENDING_HOME_READINESS_KEY);
      if (!raw) continue;

      const parsedDraft: unknown = JSON.parse(raw);
      if (!isRecord(parsedDraft)) {
        storage.removeItem(PENDING_HOME_READINESS_KEY);
        storage.removeItem(PENDING_HOME_READINESS_AUTH_KEY);
        continue;
      }

      const savedAt = parsedDraft.savedAt;
      const now = Date.now();
      if (
        parsedDraft.version !== PENDING_HOME_READINESS_VERSION ||
        typeof savedAt !== "number" ||
        !Number.isFinite(savedAt) ||
        savedAt > now + 5 * 60 * 1000 ||
        now - savedAt > PENDING_HOME_READINESS_MAX_AGE_MS
      ) {
        storage.removeItem(PENDING_HOME_READINESS_KEY);
        storage.removeItem(PENDING_HOME_READINESS_AUTH_KEY);
        continue;
      }

      const answers = homeReadinessAnswersSchema.safeParse(parsedDraft.answers);
      if (!answers.success) {
        storage.removeItem(PENDING_HOME_READINESS_KEY);
        storage.removeItem(PENDING_HOME_READINESS_AUTH_KEY);
        continue;
      }

      return answers.data;
    } catch {
      continue;
    }
  }

  return null;
}

export function savePendingHomeReadinessProgress(
  answers: HomeReadinessProgressAnswers,
  stepIndex: number,
): boolean {
  const candidate = { ...answers };
  const budgetRange = candidate.budgetRange;
  if (
    budgetRange &&
    (typeof budgetRange.min !== "number" ||
      !Number.isFinite(budgetRange.min) ||
      typeof budgetRange.max !== "number" ||
      !Number.isFinite(budgetRange.max) ||
      budgetRange.max <= 0 ||
      budgetRange.max < budgetRange.min)
  ) {
    delete candidate.budgetRange;
  }
  if (typeof candidate.monthlyIncome === "number" && !Number.isFinite(candidate.monthlyIncome)) {
    delete candidate.monthlyIncome;
  }
  if (typeof candidate.preferredArea === "string" && candidate.preferredArea.trim() === "") {
    delete candidate.preferredArea;
  }

  const parsed = homeReadinessAnswersSchema.partial().safeParse(candidate);
  const storage = getSessionStorage();
  if (!parsed.success || !storage || !Number.isInteger(stepIndex) || stepIndex < 0 || stepIndex > 8) return false;

  try {
    storage.setItem(
      PENDING_HOME_READINESS_PROGRESS_KEY,
      JSON.stringify({
        version: PENDING_HOME_READINESS_VERSION,
        savedAt: Date.now(),
        stepIndex,
        answers: parsed.data,
      }),
    );
    return true;
  } catch {
    return false;
  }
}

export function getPendingHomeReadinessProgress(): HomeReadinessProgress | null {
  const storage = getSessionStorage();
  if (!storage) return null;

  try {
    const raw = storage.getItem(PENDING_HOME_READINESS_PROGRESS_KEY);
    if (!raw) return null;

    const parsedProgress: unknown = JSON.parse(raw);
    if (!isRecord(parsedProgress)) {
      storage.removeItem(PENDING_HOME_READINESS_PROGRESS_KEY);
      return null;
    }

    const savedAt = parsedProgress.savedAt;
    const stepIndex = parsedProgress.stepIndex;
    const now = Date.now();
    if (
      parsedProgress.version !== PENDING_HOME_READINESS_VERSION ||
      typeof savedAt !== "number" ||
      !Number.isFinite(savedAt) ||
      savedAt > now + 5 * 60 * 1000 ||
      now - savedAt > PENDING_HOME_READINESS_MAX_AGE_MS ||
      typeof stepIndex !== "number" ||
      !Number.isInteger(stepIndex) ||
      stepIndex < 0 ||
      stepIndex > 8
    ) {
      storage.removeItem(PENDING_HOME_READINESS_PROGRESS_KEY);
      return null;
    }

    const answers = homeReadinessAnswersSchema.partial().safeParse(parsedProgress.answers);
    if (!answers.success) {
      storage.removeItem(PENDING_HOME_READINESS_PROGRESS_KEY);
      return null;
    }

    return { stepIndex, answers: answers.data };
  } catch {
    return null;
  }
}

export function clearPendingHomeReadinessQuiz(): void {
  for (const storage of [getLocalStorage(), getSessionStorage()]) {
    if (!storage) continue;

    try {
      storage.removeItem(PENDING_HOME_READINESS_KEY);
      storage.removeItem(PENDING_HOME_READINESS_PROGRESS_KEY);
      storage.removeItem(PENDING_HOME_READINESS_AUTH_KEY);
      storage.removeItem(PENDING_QUIZ_SESSION_KEY);
    } catch {
      // Storage can be unavailable in privacy-restricted browser contexts.
    }
  }
}

/**
 * Server-signed token issued when an anonymous visitor starts the quiz. The
 * server only creates an account when registration carries this token, so it
 * is kept alongside the pending answers until sign-up completes.
 */
export function savePendingQuizSessionToken(token: string, expiresAt: string): void {
  const storage = getLocalStorage() ?? getSessionStorage();
  if (!storage) return;

  try {
    storage.setItem(PENDING_QUIZ_SESSION_KEY, JSON.stringify({ token, expiresAt }));
  } catch {
    // Storage can be unavailable in privacy-restricted browser contexts.
  }
}

export function getPendingQuizSessionToken(): string | null {
  for (const storage of [getLocalStorage(), getSessionStorage()]) {
    if (!storage) continue;

    try {
      const raw = storage.getItem(PENDING_QUIZ_SESSION_KEY);
      if (!raw) continue;

      const parsed: unknown = JSON.parse(raw);
      const token = isRecord(parsed) ? parsed.token : null;
      const expiresAt = isRecord(parsed) && typeof parsed.expiresAt === "string" ? Date.parse(parsed.expiresAt) : NaN;
      if (typeof token !== "string" || !token || !Number.isFinite(expiresAt) || expiresAt <= Date.now()) {
        storage.removeItem(PENDING_QUIZ_SESSION_KEY);
        continue;
      }
      return token;
    } catch {
      continue;
    }
  }

  return null;
}

export function markPendingHomeReadinessAuthHandoff(): void {
  const storage = getLocalStorage() ?? getSessionStorage();
  if (!storage) return;

  try {
    storage.setItem(PENDING_HOME_READINESS_AUTH_KEY, "1");
  } catch {
    // Storage can be unavailable in privacy-restricted browser contexts.
  }
}

export function hasPendingHomeReadinessAuthHandoff(): boolean {
  for (const storage of [getLocalStorage(), getSessionStorage()]) {
    if (!storage) continue;

    try {
      if (storage.getItem(PENDING_HOME_READINESS_AUTH_KEY) === "1" && getPendingHomeReadinessQuiz()) {
        return true;
      }
    } catch {
      // Storage can be unavailable in privacy-restricted browser contexts.
    }
  }

  return false;
}