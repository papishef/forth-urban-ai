import type { StoragePlanId } from "@forth-urban/shared-types";
import { STORAGE_PLANS } from "@forth-urban/shared-types";
import { recordAuditLog } from "../../lib/audit-log.service.js";
import { StoragePayment, type StoragePaymentDocument } from "./storage-payment.model.js";
import { StorageSubscription } from "./storage-subscription.model.js";

export type PaidStoragePlanId = Exclude<StoragePlanId, "free">;

export function getStoragePlan(planId: string) {
  return STORAGE_PLANS.find((plan) => plan.id === planId) ?? null;
}

export function getPaidStoragePlan(planId: string) {
  const plan = getStoragePlan(planId);
  return plan && plan.id !== "free" ? plan : null;
}

function addOneMonth(date: Date): Date {
  const next = new Date(date);
  next.setMonth(next.getMonth() + 1);
  return next;
}

export async function getStorageSubscription() {
  const existing = await StorageSubscription.findOne({ key: "global" });
  if (existing) return existing;
  try {
    return await StorageSubscription.create({
      key: "global",
      planId: "free",
      storageBytes: STORAGE_PLANS[0].storageBytes,
      status: "active",
      autoRenew: true,
    });
  } catch (error) {
    if ((error as { code?: number }).code !== 11000) throw error;
    return (await StorageSubscription.findOne({ key: "global" }))!;
  }
}

export async function settleStoragePayment(input: {
  payment: StoragePaymentDocument;
  transactionId: string;
  rawResponse: Record<string, unknown>;
  cardToken?: string | null;
  subscriptionRef?: string | number | null;
  actorId?: string | null;
}): Promise<void> {
  if (input.payment.status === "successful") return;

  const plan = getPaidStoragePlan(input.payment.planId);
  if (!plan) return;

  input.payment.status = "successful";
  input.payment.transactionId = input.transactionId;
  input.payment.rawResponse = input.rawResponse;
  await input.payment.save();

  const subscription = await getStorageSubscription();
  subscription.planId = plan.id;
  subscription.storageBytes = plan.storageBytes;
  subscription.status = "active";
  subscription.autoRenew = true;
  subscription.currentPeriodEnd = addOneMonth(new Date());
  subscription.lastPaymentAt = new Date();
  subscription.lastPaymentStatus = "successful";
  subscription.flutterwave = {
    customerEmail: input.payment.customerEmail,
    cardToken: input.cardToken ?? subscription.flutterwave?.cardToken ?? null,
    lastTransactionId: input.transactionId,
    lastTransactionRef: input.payment.txRef,
    subscriptionRef: input.subscriptionRef ? String(input.subscriptionRef) : subscription.flutterwave?.subscriptionRef ?? null,
  };
  await subscription.save();

  await recordAuditLog({
    actorId: input.actorId ?? null,
    actorType: input.actorId ? "admin" : "system",
    action: "storage_plan_activated",
    targetType: "StorageSubscription",
    targetId: subscription._id.toString(),
    metadata: { planId: plan.id, amountNaira: plan.priceNaira, txRef: input.payment.txRef },
  });
}

export async function markStoragePaymentFailed(payment: StoragePaymentDocument, rawResponse: Record<string, unknown>): Promise<void> {
  payment.status = "failed";
  payment.rawResponse = rawResponse;
  await payment.save();

  const subscription = await getStorageSubscription();
  if (subscription.planId !== "free") {
    subscription.status = "past_due";
    subscription.lastPaymentStatus = "failed";
    await subscription.save();
  }
}

export async function findStoragePayment(txRef: string | undefined, transactionId: string | undefined) {
  if (txRef) {
    const payment = await StoragePayment.findOne({ txRef });
    if (payment) return payment;
  }
  if (transactionId) return StoragePayment.findOne({ transactionId });
  return null;
}