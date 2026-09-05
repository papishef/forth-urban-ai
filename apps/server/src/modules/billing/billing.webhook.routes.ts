import { timingSafeEqual } from "node:crypto";
import { Router } from "express";
import { flutterwaveWebhookSchema } from "@forth-urban/validation";
import { env } from "../../config/env.js";
import { ApiError, type ApiEnvelope } from "../../middleware/error-handler.js";
import { validateBody } from "../../middleware/validate.js";
import { logger } from "../../config/logger.js";
import { verifyTransaction } from "../../lib/flutterwave.util.js";
import { STORAGE_PLANS } from "@forth-urban/shared-types";
import { StoragePayment } from "./storage-payment.model.js";
import {
  findStoragePayment,
  getPaidStoragePlan,
  getStorageSubscription,
  markStoragePaymentFailed,
  settleStoragePayment,
  type PaidStoragePlanId,
} from "./billing.service.js";

export const billingWebhookRouter: Router = Router();

function matchesWebhookHash(received: string | undefined): boolean {
  if (!received || !env.FLUTTERWAVE_WEBHOOK_SECRET_HASH) return false;
  const expected = Buffer.from(env.FLUTTERWAVE_WEBHOOK_SECRET_HASH);
  const candidate = Buffer.from(received);
  return expected.length === candidate.length && timingSafeEqual(expected, candidate);
}

billingWebhookRouter.post("/webhook", validateBody(flutterwaveWebhookSchema), async (req, res, next) => {
  try {
    const receivedHash = req.headers["verif-hash"];
    const hash = typeof receivedHash === "string" ? receivedHash : undefined;
    if (!matchesWebhookHash(hash)) throw new ApiError(401, "Invalid Flutterwave webhook signature");

    const data = req.body.data ?? {};
    const txRef = typeof data.tx_ref === "string" ? data.tx_ref : undefined;
    const transactionId = data.id === undefined || data.id === null ? undefined : String(data.id);
    let payment = await findStoragePayment(txRef, transactionId);

    const status = typeof data.status === "string" ? data.status.toLowerCase() : "";
    if (status !== "successful" || !transactionId) {
      if (payment && status && status !== "successful") {
        await markStoragePaymentFailed(payment, data);
      } else if (status && status !== "successful") {
        const subscription = await getStorageSubscription();
        if (subscription.planId !== "free") {
          subscription.status = "past_due";
          subscription.lastPaymentStatus = "failed";
          await subscription.save();
        }
      }
      const body: ApiEnvelope = { success: true, message: "Webhook acknowledged", data: null, errors: null };
      res.json(body);
      return;
    }

    const verified = await verifyTransaction(transactionId);
    if (!payment) {
      const meta = typeof data.meta === "object" && data.meta !== null ? (data.meta as Record<string, unknown>) : {};
      const metadataPlanId = typeof meta.storagePlanId === "string" ? meta.storagePlanId : undefined;
      const amountPlan = STORAGE_PLANS.find((plan) => plan.id !== "free" && plan.priceNaira === Number(verified.amount));
      const plan = getPaidStoragePlan(metadataPlanId ?? amountPlan?.id ?? "");
      const subscription = await getStorageSubscription();
      const customer = typeof data.customer === "object" && data.customer !== null ? (data.customer as Record<string, unknown>) : {};
      const customerEmail = typeof customer.email === "string" ? customer.email : subscription.flutterwave?.customerEmail;
      const recurringTxRef = verified.tx_ref ?? txRef;
      if (!plan || !customerEmail || !recurringTxRef) {
        logger.warn({ transactionId }, "Could not map recurring Flutterwave charge to storage plan");
        const body: ApiEnvelope = { success: true, message: "Webhook acknowledged", data: null, errors: null };
        res.json(body);
        return;
      }
      try {
        payment = await StoragePayment.create({
          planId: plan.id as PaidStoragePlanId,
          amountNaira: plan.priceNaira,
          currency: "NGN",
          txRef: recurringTxRef,
          transactionId,
          customerEmail,
          status: "pending",
        });
      } catch (error) {
        if ((error as { code?: number }).code === 11000) {
          payment = await findStoragePayment(recurringTxRef, transactionId);
        } else {
          throw error;
        }
      }
    }
    if (!payment) {
      const body: ApiEnvelope = { success: true, message: "Webhook acknowledged", data: null, errors: null };
      res.json(body);
      return;
    }
    if (
      verified.status !== "successful" ||
      Number(verified.amount) !== payment.amountNaira ||
      verified.currency !== "NGN" ||
      (verified.tx_ref && verified.tx_ref !== payment.txRef)
    ) {
      logger.warn({ txRef: payment.txRef }, "Rejected mismatched Flutterwave webhook payment");
      await markStoragePaymentFailed(payment, verified as unknown as Record<string, unknown>);
      const body: ApiEnvelope = { success: true, message: "Webhook acknowledged", data: null, errors: null };
      res.json(body);
      return;
    }

    await settleStoragePayment({
      payment,
      transactionId,
      rawResponse: verified as unknown as Record<string, unknown>,
      cardToken: verified.card?.token ?? null,
      subscriptionRef: verified.subscription_id,
    });

    const body: ApiEnvelope = { success: true, message: "Webhook processed", data: null, errors: null };
    res.json(body);
  } catch (err) {
    next(err);
  }
});