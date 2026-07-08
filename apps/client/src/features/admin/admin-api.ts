import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  AdminAuditLogDTO,
  AdminCrmEventDTO,
  AdminEmailCampaignSummaryDTO,
  AdminInspectionBookingDTO,
  AdminPromptDTO,
  AdminPromptPreviewDTO,
  AdminQuizAnalyticsDTO,
  AdminUserDTO,
  AreaDTO,
  PaginatedResultDTO,
  PropertyDTO,
  SettingsDTO,
  UserRole,
  UserStatus,
} from "@forth-urban/shared-types";
import type {
  AdminAreaInput,
  AdminMediaDeleteInput,
  AdminMediaUploadInput,
  AdminPreviewPromptInput,
  AdminPropertyInput,
  AdminPropertyUpdateInput,
  AdminUpdateCrmEventInput,
  AdminUpdateInspectionInput,
  AdminUpdatePromptInput,
  AdminUpdateSettingsInput,
} from "@forth-urban/validation";
import { apiClient } from "../../lib/api-client";

interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T | null;
}

/**
 * Phase 7: Admin dashboard API hooks — every request here hits an
 * `/api/admin/*` route gated to `role=admin` on the server
 * (docs/IMPLEMENTATION_PLAN.md#phase-7--admin-dashboard).
 */

async function get<T>(path: string): Promise<T> {
  const res = await apiClient.get<ApiEnvelope<T>>(path);
  return res.data.data as T;
}

async function post<T>(path: string, body?: unknown): Promise<T> {
  const res = await apiClient.post<ApiEnvelope<T>>(path, body);
  return res.data.data as T;
}

async function patch<T>(path: string, body?: unknown): Promise<T> {
  const res = await apiClient.patch<ApiEnvelope<T>>(path, body);
  return res.data.data as T;
}

async function del<T>(path: string, body?: unknown): Promise<T> {
  const res = await apiClient.delete<ApiEnvelope<T>>(path, { data: body });
  return res.data.data as T;
}

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------

export function useAdminUsers(page: number, search = "") {
  return useQuery({
    queryKey: ["admin", "users", page, search],
    queryFn: () =>
      get<PaginatedResultDTO<AdminUserDTO>>(
        `/admin/users?page=${page}&limit=20${search ? `&search=${encodeURIComponent(search)}` : ""}`,
      ),
  });
}

export function useAdminUpdateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, role, status }: { id: string; role?: UserRole; status?: UserStatus }) =>
      patch<AdminUserDTO>(`/admin/users/${id}`, { role, status }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["admin", "users"] }),
  });
}

// Re-auth gate for the sensitive user role/status change on the admin Users
// tab — confirms the caller's own password before the update mutation runs.
export function useVerifyPassword() {
  return useMutation({
    mutationFn: (password: string) => post<null>("/auth/password/verify", { password }),
  });
}

// ---------------------------------------------------------------------------
// Properties
// ---------------------------------------------------------------------------

export function useAdminProperties(page: number) {
  return useQuery({
    queryKey: ["admin", "properties", page],
    queryFn: () => get<PaginatedResultDTO<PropertyDTO>>(`/admin/properties?page=${page}&limit=20`),
  });
}

export function useAdminCreateProperty() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: AdminPropertyInput) => post<PropertyDTO>("/admin/properties", input),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["admin", "properties"] }),
  });
}

export function useAdminUpdateProperty() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: AdminPropertyUpdateInput }) =>
      patch<PropertyDTO>(`/admin/properties/${id}`, input),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["admin", "properties"] }),
  });
}

export function useAdminDeleteProperty() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/admin/properties/${id}`);
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["admin", "properties"] }),
  });
}

export function useAdminUploadPropertyMedia() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: AdminMediaUploadInput }) =>
      post<PropertyDTO>(`/admin/properties/${id}/media`, input),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["admin", "properties"] }),
  });
}

export function useAdminDeletePropertyMedia() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: AdminMediaDeleteInput }) =>
      del<PropertyDTO>(`/admin/properties/${id}/media`, input),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["admin", "properties"] }),
  });
}

// ---------------------------------------------------------------------------
// Inspections
// ---------------------------------------------------------------------------

export function useAdminInspections(page: number, status = "") {
  return useQuery({
    queryKey: ["admin", "inspections", page, status],
    queryFn: () =>
      get<PaginatedResultDTO<AdminInspectionBookingDTO>>(
        `/admin/inspections?page=${page}&limit=20${status ? `&status=${status}` : ""}`,
      ),
  });
}

export function useAdminUpdateInspection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: AdminUpdateInspectionInput }) =>
      patch<AdminInspectionBookingDTO>(`/admin/inspections/${id}`, input),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["admin", "inspections"] }),
  });
}

// ---------------------------------------------------------------------------
// CRM
// ---------------------------------------------------------------------------

export function useAdminCrmBoard(pipelineStage = "") {
  return useQuery({
    queryKey: ["admin", "crm", pipelineStage],
    queryFn: () => get<AdminCrmEventDTO[]>(`/admin/crm${pipelineStage ? `?pipelineStage=${pipelineStage}` : ""}`),
  });
}

export function useAdminUpdateCrmEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, input }: { userId: string; input: AdminUpdateCrmEventInput }) =>
      patch<AdminCrmEventDTO>(`/admin/crm/${userId}`, input),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["admin", "crm"] }),
  });
}

// ---------------------------------------------------------------------------
// Email campaigns
// ---------------------------------------------------------------------------

export function useAdminEmailCampaigns() {
  return useQuery({
    queryKey: ["admin", "email-campaigns"],
    queryFn: () => get<AdminEmailCampaignSummaryDTO[]>("/admin/email-campaigns"),
  });
}

// ---------------------------------------------------------------------------
// Analytics
// ---------------------------------------------------------------------------

export function useAdminQuizAnalytics() {
  return useQuery({
    queryKey: ["admin", "analytics", "quiz"],
    queryFn: () => get<AdminQuizAnalyticsDTO>("/admin/analytics/quiz"),
  });
}

// ---------------------------------------------------------------------------
// Logs
// ---------------------------------------------------------------------------

export function useAdminLogs(page: number, action = "") {
  return useQuery({
    queryKey: ["admin", "logs", page, action],
    queryFn: () =>
      get<PaginatedResultDTO<AdminAuditLogDTO>>(`/admin/logs?page=${page}&limit=50${action ? `&action=${action}` : ""}`),
  });
}

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------

export function useAdminSettings() {
  return useQuery({
    queryKey: ["admin", "settings"],
    queryFn: () => get<SettingsDTO>("/admin/settings"),
  });
}

export function useAdminUpdateSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: AdminUpdateSettingsInput) => patch<SettingsDTO>("/admin/settings", input),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["admin", "settings"] }),
  });
}

// ---------------------------------------------------------------------------
// Areas
// ---------------------------------------------------------------------------

export function useAdminAreas() {
  return useQuery({
    queryKey: ["admin", "areas"],
    queryFn: () => get<AreaDTO[]>("/admin/areas"),
  });
}

export function useAdminUpsertArea() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: AdminAreaInput) => post<AreaDTO>("/admin/areas", input),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["admin", "areas"] }),
  });
}

export function useAdminDeleteArea() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/admin/areas/${id}`);
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["admin", "areas"] }),
  });
}

// ---------------------------------------------------------------------------
// Prompts
// ---------------------------------------------------------------------------

export function useAdminPrompts() {
  return useQuery({
    queryKey: ["admin", "prompts"],
    queryFn: () => get<AdminPromptDTO[]>("/admin/prompts"),
  });
}

export function useAdminUpdatePrompt() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ key, input }: { key: string; input: AdminUpdatePromptInput }) =>
      patch<AdminPromptDTO>(`/admin/prompts/${key}`, input),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["admin", "prompts"] }),
  });
}

export function useAdminPreviewPrompt() {
  return useMutation({
    mutationFn: ({ key, input }: { key: string; input: AdminPreviewPromptInput }) =>
      post<AdminPromptPreviewDTO>(`/admin/prompts/${key}/preview`, input),
  });
}
