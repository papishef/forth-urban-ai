import { useMutation, useQuery } from "@tanstack/react-query";
import type { AreaQuizAnswers, HomeReadinessAnswers } from "@forth-urban/validation";
import type { AreaQuizResultDTO, HomeReadinessResultDTO, ProfileDTO } from "@forth-urban/shared-types";
import { apiClient } from "../../lib/api-client";

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
