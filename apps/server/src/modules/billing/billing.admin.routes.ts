import { Router } from "express";
import {
  adminStorageAutoRenewSchema,
  adminStorageCheckoutSchema,
  adminStorageVerifySchema,
} from "@forth-urban/validation";
import type { StoragePaymentDTO } from "@forth-urban/shared-types";
import { env } from "../../config/env.js";
import { ApiError, type ApiEnvelope } from "../../middleware/error-handler.js";
import { validateBody } from "../../middleware/validate.js";
import { cancelSubscription, createPaymentLink, createTransactionReference, getFlutterwavePlanReference, verifyTransaction } from "../../lib/flutterwave.util.js";
import { requireAdminPermission } from "../auth/permissions.js";
import { getStorageStatus } from "./storage-quota.service.js";
import { StoragePayment } from "./storage-payment.model.js";
import {
  findStoragePayment,
  getPaidStoragePlan,
  getStorageSubscription,
  markStoragePaymentFailed,
  settleStoragePayment,
  type PaidStoragePlanId,
} from "./billing.service.js";

export const billingAdminRouter: Router = Router();

billingAdminRouter.get("/storage", async (_req, res, next) => {
  try {
    const body: ApiEnvelope = { success: true, message: "OK", data: await getStorageStatus(), errors: null };
    res.json(body);
  } catch (err) {
    next(err);
  }
});

billingAdminRouter.get("/payments", async (_req, res, next) => {
  try {
    const payments = await StoragePayment.find().sort({ createdAt: -1 }).limit(20);
    const data: StoragePaymentDTO[] = payments.map((payment) => ({
      id: payment._id.toString(),
      planId: payment.planId as StoragePaymentDTO["planId"],
      amountNaira: payment.amountNaira,
      status: payment.status as StoragePaymentDTO["status"],
      txRef: payment.txRef,
      createdAt: (payment.get("createdAt") as Date).toISOString(),
    }));
    const body: ApiEnvelope = { success: true, message: "OK", data, errors: null };
    res.json(body);
  } catch (err) {
    next(err);
  }
});

billingAdminRouter.post(
  "/checkout",
  requireAdminPermission("settings", "write"),
  validateBody(adminStorageCheckoutSchema),
  async (req, res, next) => {
    try {
      const plan = getPaidStoragePlan(req.body.planId);
      if (!plan) throw new ApiError(400, "Choose a valid storage plan");

      const planId = plan.id as PaidStoragePlanId;
      if (!env.FLUTTERWAVE_SECRET_KEY) {
        throw new ApiError(503, "Storage billing is not configured yet");
      }
      if (!getFlutterwavePlanReference(planId)) {
        throw new ApiError(503, "This storage plan is awaiting its Flutterwave recurring plan ID");
      }

      const txRef = createTransactionReference(planId);
      const payment = await StoragePayment.create({
        planId,
        amountNaira: plan.priceNaira,
        currency: "NGN",
        txRef,
        customerEmail: req.auth!.email,
        status: "pending",
      });

      try {
        const paymentLink = await createPaymentLink({
          txRef,
          amountNaira: plan.priceNaira,
          email: req.auth!.email,
          name: `${req.authUser?.firstName ?? "Forth"} ${req.authUser?.lastName ?? "Urban"}`,
          planId,
          redirectUrl: `${env.CLIENT_URL.replace(/\/$/, "")}/admin/settings/storage-payment`,
        });
        const body: ApiEnvelope = {
          success: true,
          message: "Checkout created",
          data: { paymentLink, txRef, planId },
          errors: null,
        };
        res.status(201).json(body);
      } catch (error) {
        payment.status = "failed";
        payment.rawResponse = { message: error instanceof Error ? error.message : "Flutterwave request failed" };
        await payment.save();
        throw error;
      }
    } catch (err) {
      next(err);
    }
  },
);

billingAdminRouter.post(
  "/verify",
  requireAdminPermission("settings", "write"),
  validateBody(adminStorageVerifySchema),
  async (req, res, next) => {
    try {
      const payment = await findStoragePayment(req.body.txRef, req.body.transactionId);
      if (!payment) throw new ApiError(404, "Storage payment could not be found");
      if (req.body.txRef && payment.txRef !== req.body.txRef) {
        throw new ApiError(400, "Payment reference does not match the checkout");
      }

      if (payment.status !== "successful") {
        const verified = await verifyTransaction(req.body.transactionId);
        const amountMatches = Number(verified.amount) === payment.amountNaira;
        const currencyMatches = verified.currency === "NGN";
        const referenceMatches = !verified.tx_ref || verified.tx_ref === payment.txRef;
        if (verified.status !== "successful" || !amountMatches || !currencyMatches || !referenceMatches) {
          await markStoragePaymentFailed(payment, verified as unknown as Record<string, unknown>);
          throw new ApiError(402, "Flutterwave did not confirm this payment");
        }

        await settleStoragePayment({
          payment,
          transactionId: String(verified.id ?? req.body.transactionId),
          rawResponse: verified as unknown as Record<string, unknown>,
          cardToken: verified.card?.token ?? null,
          subscriptionRef: verified.subscription_id,
          actorId: req.auth!.sub,
        });
      }

      const body: ApiEnvelope = { success: true, message: "Storage plan activated", data: await getStorageStatus(), errors: null };
      res.json(body);
    } catch (err) {
      next(err);
    }
  },
);

billingAdminRouter.patch(
  "/auto-renew",
  requireAdminPermission("settings", "write"),
  validateBody(adminStorageAutoRenewSchema),
  async (req, res, next) => {
    try {
      const subscription = await getStorageSubscription();
      if (subscription.planId === "free") throw new ApiError(400, "There is no paid storage plan to manage");
      if (req.body.autoRenew && subscription.autoRenew === false) {
        throw new ApiError(409, "Purchase the plan again to restart automatic renewal");
      }
      if (!req.body.autoRenew && subscription.flutterwave?.subscriptionRef) {
        await cancelSubscription(subscription.flutterwave.subscriptionRef);
      }

      subscription.autoRenew = req.body.autoRenew;
      await subscription.save();
      const body: ApiEnvelope = { success: true, message: req.body.autoRenew ? "Automatic renewal enabled" : "Automatic renewal canceled", data: await getStorageStatus(), errors: null };
      res.json(body);
    } catch (err) {
      next(err);
    }
  },
);