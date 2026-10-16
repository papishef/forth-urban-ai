import { useMutation, useQuery } from "@tanstack/react-query";
import type {
  BlogPostDTO,
  BlogPostListItemDTO,
  NewsletterSubscriberDTO,
  PaginatedResultDTO,
} from "@forth-urban/shared-types";
import type { ContactMessageInput, NewsletterSubscribeInput } from "@forth-urban/validation";
import { apiClient } from "../../lib/api-client";

interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T | null;
}

async function get<T>(path: string): Promise<T> {
  const res = await apiClient.get<ApiEnvelope<T>>(path);
  return res.data.data as T;
}

async function post<T>(path: string, body?: unknown): Promise<T> {
  const res = await apiClient.post<ApiEnvelope<T>>(path, body);
  return res.data.data as T;
}

// ---------------------------------------------------------------------------
// Blog API Hooks
// ---------------------------------------------------------------------------

export function useBlogPosts(page = 1, category?: string, tag?: string) {
  return useQuery({
    queryKey: ["blog", "posts", page, category, tag],
    queryFn: () => {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", "9");
      if (category) params.set("category", category);
      if (tag) params.set("tag", tag);
      return get<PaginatedResultDTO<BlogPostListItemDTO>>(`/blog?${params.toString()}`);
    },
  });
}

export function useBlogPost(slug: string | undefined) {
  return useQuery({
    queryKey: ["blog", "post", slug],
    queryFn: () => get<BlogPostDTO>(`/blog/${slug}`),
    enabled: Boolean(slug),
  });
}

// ---------------------------------------------------------------------------
// Contact API Hook
// ---------------------------------------------------------------------------

export function useSubmitContact() {
  return useMutation({
    mutationFn: (input: ContactMessageInput) =>
      post<{ id: string }>("/contact", input),
  });
}

// ---------------------------------------------------------------------------
// Newsletter API Hooks
// ---------------------------------------------------------------------------

export function useSubscribeNewsletter() {
  return useMutation({
    mutationFn: (input: NewsletterSubscribeInput) =>
      post<{ email: string; status: string }>("/newsletter/subscribe", input),
  });
}

export function useConfirmNewsletter(token: string | undefined) {
  return useQuery({
    queryKey: ["newsletter", "confirm", token],
    queryFn: () => get<NewsletterSubscriberDTO>(`/newsletter/confirm/${token}`),
    enabled: Boolean(token),
    retry: false,
  });
}

export function useUnsubscribeNewsletter(token: string | undefined) {
  return useQuery({
    queryKey: ["newsletter", "unsubscribe", token],
    queryFn: () => get<NewsletterSubscriberDTO>(`/newsletter/unsubscribe/${token}`),
    enabled: Boolean(token),
    retry: false,
  });
}
