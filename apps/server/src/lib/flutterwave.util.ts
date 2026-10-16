import type { StoragePlanId } from "@forth-urban/shared-types";
import { randomUUID } from "node:crypto";
import { env, type Env } from "../config/env.js";
import { ApiError } from "../middleware/error-handler.js";

const FLUTTERWAVE_API_URL = "https://api.flutterwave.com/v3";

interface FlutterwaveEnvelope<T> {
  status?: string;
  message?: string;
  data?: T;
}

export interface FlutterwaveTransactionData {
  id?: number | string;
  status?: string;
  amount?: number;
  currency?: string;
  tx_ref?: string;
  card?: { token?: string } | null;
  subscription_id?: string | number | null;
}

function ensureConfigured(): void {
  if (!env.FLUTTERWAVE_SECRET_KEY) {
    throw new ApiError(503, "Storage billing is not configured yet");
  }
}

async function request<T>(path: string, init: RequestInit): Promise<T> {
  ensureConfigured();
  const response = await fetch(`${FLUTTERWAVE_API_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${env.FLUTTERWAVE_SECRET_KEY}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
  const payload = (await response.json().catch(() => null)) as FlutterwaveEnvelope<T> | null;
  if (!response.ok || payload?.status !== "success" || payload.data === undefined) {
    throw new ApiError(502, payload?.message ?? "Flutterwave request failed");
  }
  return payload.data;
}

export function createTransactionReference(planId: Exclude<StoragePlanId, "free">): string {
  return `forth-storage-${planId}-${randomUUID()}`;
}

const FLUTTERWAVE_PLAN_ENV: Record<
  Exclude<StoragePlanId, "free">,
  keyof Pick<Env, "FLUTTERWAVE_PLAN_5GB" | "FLUTTERWAVE_PLAN_50GB" | "FLUTTERWAVE_PLAN_200GB">
> = {
  starter_5gb: "FLUTTERWAVE_PLAN_5GB",
  growth_50gb: "FLUTTERWAVE_PLAN_50GB",
  scale_200gb: "FLUTTERWAVE_PLAN_200GB",
};

export function getFlutterwavePlanReference(planId: Exclude<StoragePlanId, "free">): string | null {
  const value = env[FLUTTERWAVE_PLAN_ENV[planId]];
  return typeof value === "string" ? value : null;
}

export async function createPaymentLink(input: {
  txRef: string;
  amountNaira: number;
  email: string;
  name: string;
  planId: Exclude<StoragePlanId, "free">;
  redirectUrl: string;
}): Promise<string> {
  const paymentPlan = getFlutterwavePlanReference(input.planId);
  const data = await request<{ link?: string }>("/payments", {
    method: "POST",
    body: JSON.stringify({
      tx_ref: input.txRef,
      amount: input.amountNaira,
      currency: "NGN",
      redirect_url: input.redirectUrl,
      payment_options: "card",
      ...(paymentPlan ? { payment_plan: paymentPlan } : {}),
      customer: { email: input.email, name: input.name },
      customizations: {
        title: "Forth Urban Storage",
        description: `${input.planId} storage plan billed monthly`,
      },
      meta: { storagePlanId: input.planId },
    }),
  });
  if (!data.link) throw new ApiError(502, "Flutterwave did not return a payment link");
  return data.link;
}

export async function verifyTransaction(transactionId: string): Promise<FlutterwaveTransactionData> {
  return request<FlutterwaveTransactionData>(`/transactions/${encodeURIComponent(transactionId)}/verify`, {
    method: "GET",
  });
}

export async function chargeToken(input: {
  cardToken: string;
  amountNaira: number;
  email: string;
  txRef: string;
}): Promise<FlutterwaveTransactionData> {
  return request<FlutterwaveTransactionData>("/tokenized-charges", {
    method: "POST",
    body: JSON.stringify({
      card_token: input.cardToken,
      currency: "NGN",
      country: "NG",
      amount: input.amountNaira,
      email: input.email,
      tx_ref: input.txRef,
      narration: "Forth Urban storage renewal",
    }),
  });
}

export async function cancelSubscription(subscriptionRef: string): Promise<void> {
  await request(`/subscriptions/${encodeURIComponent(subscriptionRef)}/cancel`, { method: "PUT" });
}