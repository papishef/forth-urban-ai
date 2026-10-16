import { useMutation, useQuery } from "@tanstack/react-query";
import type { AreaQuizAnswers, HomeReadinessAnswers } from "@forth-urban/validation";
import type {
  AreaQuizResultDTO,
  HomeReadinessResultDTO,
  ProfileDTO,
  RegistrationQuizSessionDTO,
} from "@forth-urban/shared-types";
import { apiClient } from "../../lib/api-client";
import { getPendingQuizSessionToken, savePendingQuizSessionToken } from "./pending-home-readiness";

interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T | null;
}

export function useStartHomeReadinessQuiz() {
  return useMutation({
    mutationFn: async () => {
      await apiClient.post("/quiz/home-readiness/start");
    },
  });
}

let quizSessionRequest: Promise<string | null> | null = null;

/**
 * Makes sure an anonymous visitor holds a server-issued quiz session token —
 * required by POST /auth/register. Requested when the quiz starts so the
 * token is old enough (server-enforced minimum quiz duration) by sign-up.
 */
export function ensureRegistrationQuizSession(): Promise<string | null> {
  const existing = getPendingQuizSessionToken();
  if (existing) return Promise.resolve(existing);

  quizSessionRequest ??= apiClient
    .post<ApiEnvelope<RegistrationQuizSessionDTO>>("/auth/registration/quiz-session")
    .then((res) => {
      const session = res.data.data;
      if (!session) return null;
      savePendingQuizSessionToken(session.quizSessionToken, session.expiresAt);
      return session.quizSessionToken;
    })
    .catch(() => null)
    .finally(() => {
      quizSessionRequest = null;
    });

  return quizSessionRequest;
}

export function useSubmitHomeReadinessQuiz() {
  return useMutation({
    mutationFn: async (answers: HomeReadinessAnswers) => {
      const res = await apiClient.post<ApiEnvelope<HomeReadinessResultDTO>>("/quiz/home-readiness", answers);
      return res.data.data!;
    },
  });
}

export function useHomeReadinessResult(enabled: boolean) {
  return useQuery({
    queryKey: ["quiz", "home-readiness", "result"],
    queryFn: async () => {
      const res = await apiClient.get<ApiEnvelope<HomeReadinessResultDTO>>("/quiz/home-readiness/result");
      return res.data.data;
    },
    enabled,
    retry: false,
  });
}

export function useStartAreaQuiz() {
  return useMutation({
    mutationFn: async () => {
      await apiClient.post("/quiz/area/start");
    },
  });
}

export function useSubmitAreaQuiz() {
  return useMutation({
    mutationFn: async (answers: AreaQuizAnswers) => {
      const res = await apiClient.post<ApiEnvelope<AreaQuizResultDTO>>("/quiz/area", answers);
      return res.data.data!;
    },
  });
}

export function useAreaQuizResult(enabled: boolean) {
  return useQuery({
    queryKey: ["quiz", "area", "result"],
    queryFn: async () => {
      const res = await apiClient.get<ApiEnvelope<AreaQuizResultDTO>>("/quiz/area/result");
      return res.data.data;
    },
    enabled,
    retry: false,
  });
}

export function useProfile(enabled: boolean) {
  return useQuery({
    queryKey: ["profiles", "me"],
    queryFn: async () => {
      const res = await apiClient.get<ApiEnvelope<ProfileDTO>>("/profiles/me");
      return res.data.data;
    },
    enabled,
    retry: false,
  });
}
