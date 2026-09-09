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
  BlogPostDTO,
  ContactMessageDTO,
  NewsletterSubscriberDTO,
  PaginatedResultDTO,
  PropertyDTO,
  SettingsDTO,
  UserStatus,
} from "@forth-urban/shared-types";
import type {
  AdminAreaInput,
  AdminBlogMediaUploadInput,
  AdminBlogMediaDeleteInput,
  AdminBlogPostInput,
  AdminBlogPostUpdateInput,
  AdminMediaDeleteInput,
  AdminMediaUploadInput,
  AdminPreviewPromptInput,
  AdminPropertyInput,
  AdminPropertyUpdateInput,
  AdminPublishBlogPostInput,
  AdminSetKioskPasswordInput,
  AdminUpdateContactMessageInput,
  AdminUpdateCrmEventInput,
  AdminUpdateInspectionInput,
  AdminUpdatePromptInput,
  AdminUpdateSettingsInput,
  CreateSubAdminInput,
  UpdateSubAdminInput,
} from "@forth-urban/validation";
import type {
  StorageCheckoutDTO,
  StoragePaymentDTO,
  StorageStatusDTO,
} from "@forth-urban/shared-types";
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

async function post<T>(path: string, body?: unknown, headers?: Record<string, string>): Promise<T> {
  const res = await apiClient.post<ApiEnvelope<T>>(path, body, headers ? { headers } : undefined);
  return res.data.data as T;
}

async function patch<T>(
  path: string,
  body?: unknown,
  headers?: Record<string, string>,
): Promise<T> {
  const res = await apiClient.patch<ApiEnvelope<T>>(path, body, headers ? { headers } : undefined);
  return res.data.data as T;
}

async function del<T>(path: string, body?: unknown, headers?: Record<string, string>): Promise<T> {
  const res = await apiClient.delete<ApiEnvelope<T>>(path, { data: body, headers });
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
    mutationFn: ({ id, status }: { id: string; status?: UserStatus }) =>
      patch<AdminUserDTO>(`/admin/users/${id}`, { status }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["admin", "users"] }),
  });
}

export function useAdminSubAdmins() {
  return useQuery({
    queryKey: ["admin", "sub-admins"],
    queryFn: () => get<AdminUserDTO[]>("/admin/sub-admins"),
  });
}

export function useAdminSubAdminCandidates() {
  return useQuery({
    queryKey: ["admin", "sub-admin-candidates"],
    queryFn: () => get<AdminUserDTO[]>("/admin/sub-admins/candidates"),
  });
}

export function useAdminCreateSubAdmin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ input, reauthToken }: { input: CreateSubAdminInput; reauthToken: string }) =>
      post<AdminUserDTO>("/admin/sub-admins", input, { "x-reauth-token": reauthToken }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "sub-admins"] });
      void queryClient.invalidateQueries({ queryKey: ["admin", "sub-admin-candidates"] });
      void queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    },
  });
}

export function useAdminUpdateSubAdmin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      input,
      reauthToken,
    }: {
      id: string;
      input: UpdateSubAdminInput;
      reauthToken: string;
    }) => patch<AdminUserDTO>(`/admin/sub-admins/${id}`, input, { "x-reauth-token": reauthToken }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "sub-admins"] });
      void queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    },
  });
}

export function useAdminRemoveSubAdmin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, reauthToken }: { id: string; reauthToken: string }) => {
      await del<null>(`/admin/sub-admins/${id}`, {}, { "x-reauth-token": reauthToken });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "sub-admins"] });
      void queryClient.invalidateQueries({ queryKey: ["admin", "sub-admin-candidates"] });
      void queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    },
  });
}

// Re-auth gate for the sensitive user role/status change on the admin Users
// tab — confirms the caller's own password before the update mutation runs.
export function useVerifyPassword() {
  return useMutation({
    mutationFn: (password: string) =>
      post<{ reauthToken: string }>("/auth/password/verify", { password }),
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
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "properties"] });
      void queryClient.invalidateQueries({ queryKey: ["admin", "storage"] });
    },
  });
}

export function useAdminDeletePropertyMedia() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: AdminMediaDeleteInput }) =>
      del<PropertyDTO>(`/admin/properties/${id}/media`, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "properties"] });
      void queryClient.invalidateQueries({ queryKey: ["admin", "storage"] });
    },
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
    queryFn: () =>
      get<AdminCrmEventDTO[]>(
        `/admin/crm${pipelineStage ? `?pipelineStage=${pipelineStage}` : ""}`,
      ),
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
      get<PaginatedResultDTO<AdminAuditLogDTO>>(
        `/admin/logs?page=${page}&limit=50${action ? `&action=${action}` : ""}`,
      ),
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

export function useAdminStorageStatus() {
  return useQuery({
    queryKey: ["admin", "storage"],
    queryFn: () => get<StorageStatusDTO>("/admin/billing/storage"),
    staleTime: 10_000,
    refetchInterval: 15_000,
  });
}

export function useAdminStoragePayments() {
  return useQuery({
    queryKey: ["admin", "storage", "payments"],
    queryFn: () => get<StoragePaymentDTO[]>("/admin/billing/payments"),
  });
}

export function useAdminStartStorageCheckout() {
  return useMutation({
    mutationFn: (input: { planId: "starter_5gb" | "growth_50gb" | "scale_200gb" }) =>
      post<StorageCheckoutDTO>("/admin/billing/checkout", input),
  });
}

export function useAdminVerifyStoragePayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { transactionId: string; txRef?: string }) =>
      post<StorageStatusDTO>("/admin/billing/verify", input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "storage"] });
    },
  });
}

export function useAdminStoragePaymentVerification(transactionId: string, txRef?: string) {
  return useQuery({
    queryKey: ["admin", "storage", "verification", transactionId, txRef],
    queryFn: () => post<StorageStatusDTO>("/admin/billing/verify", { transactionId, txRef }),
    enabled: Boolean(transactionId),
    retry: false,
  });
}

export function useAdminSetStorageAutoRenew() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (autoRenew: boolean) => patch<StorageStatusDTO>("/admin/billing/auto-renew", { autoRenew }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "storage"] });
    },
  });
}

export function useAdminUpdateSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: AdminUpdateSettingsInput) => patch<SettingsDTO>("/admin/settings", input),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["admin", "settings"] }),
  });
}

export function useAdminSetKioskPassword() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: AdminSetKioskPasswordInput) => patch<SettingsDTO>("/admin/settings/kiosk-password", input),
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

// ---------------------------------------------------------------------------
// Blog Management
// ---------------------------------------------------------------------------

export function useAdminBlogPosts(page: number, status?: string, category?: string) {
  return useQuery({
    queryKey: ["admin", "blog", page, status, category],
    queryFn: () => {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", "20");
      if (status) params.set("status", status);
      if (category) params.set("category", category);
      return get<PaginatedResultDTO<BlogPostDTO>>(`/admin/blog?${params.toString()}`);
    },
  });
}

export function useAdminCreateBlogPost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: AdminBlogPostInput) => post<BlogPostDTO>("/admin/blog", input),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["admin", "blog"] }),
  });
}

export function useAdminUpdateBlogPost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: AdminBlogPostUpdateInput }) =>
      patch<BlogPostDTO>(`/admin/blog/${id}`, input),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["admin", "blog"] }),
  });
}

export function useAdminDeleteBlogPost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => del<null>(`/admin/blog/${id}`),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["admin", "blog"] }),
  });
}

export function useAdminUploadBlogMedia() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: AdminBlogMediaUploadInput }) =>
      post<BlogPostDTO>(`/admin/blog/${id}/media`, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "blog"] });
      void queryClient.invalidateQueries({ queryKey: ["admin", "storage"] });
    },
  });
}

export function useAdminDeleteBlogMedia() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: AdminBlogMediaDeleteInput }) =>
      del<BlogPostDTO>(`/admin/blog/${id}/media`, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "blog"] });
      void queryClient.invalidateQueries({ queryKey: ["admin", "storage"] });
    },
  });
}

export function useAdminPublishBlogPost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: AdminPublishBlogPostInput }) =>
      post<{ post: BlogPostDTO; newsletterDispatched: boolean; newsletterResult: unknown }>(
        `/admin/blog/${id}/publish`,
        input,
      ),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["admin", "blog"] }),
  });
}

// ---------------------------------------------------------------------------
// Newsletter Management
// ---------------------------------------------------------------------------

export function useAdminNewsletterSubscribers(page: number, status?: string) {
  return useQuery({
    queryKey: ["admin", "newsletter", page, status],
    queryFn: () => {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", "20");
      if (status) params.set("status", status);
      return get<
        PaginatedResultDTO<NewsletterSubscriberDTO> & {
          counts: { confirmed: number; pending: number; unsubscribed: number; total: number };
        }
      >(`/admin/newsletter?${params.toString()}`);
    },
  });
}

// ---------------------------------------------------------------------------
// Contact Messages Inbox
// ---------------------------------------------------------------------------

export function useAdminContactMessages(page: number, status?: string) {
  return useQuery({
    queryKey: ["admin", "contact-messages", page, status],
    queryFn: () => {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", "20");
      if (status) params.set("status", status);
      return get<PaginatedResultDTO<ContactMessageDTO>>(
        `/admin/contact-messages?${params.toString()}`,
      );
    },
  });
}

export function useAdminUpdateContactMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: AdminUpdateContactMessageInput }) =>
      patch<ContactMessageDTO>(`/admin/contact-messages/${id}`, input),
    onSuccess: () =>
      void queryClient.invalidateQueries({ queryKey: ["admin", "contact-messages"] }),
  });
}
