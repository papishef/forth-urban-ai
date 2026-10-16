import { Router } from "express";
import { randomBytes } from "node:crypto";
import { rateLimit } from "express-rate-limit";
import { newsletterSubscribeSchema } from "@forth-urban/validation";
import type { ApiEnvelope } from "../../middleware/error-handler.js";
import { validateBody } from "../../middleware/validate.js";
import { sendEmail } from "../../lib/email.service.js";
import { env } from "../../config/env.js";
import { logger } from "../../config/logger.js";
import { NewsletterSubscriber, toNewsletterSubscriberDTO } from "./newsletter-subscriber.model.js";

export const newsletterRouter: Router = Router();

const newsletterRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 15,
  standardHeaders: true,
  legacyHeaders: false,
});

newsletterRouter.use(newsletterRateLimiter);

newsletterRouter.post("/subscribe", validateBody(newsletterSubscribeSchema), async (req, res, next) => {
  try {
    const { email, websiteUrl } = req.body;

    // Honeypot check
    if (websiteUrl) {
      logger.warn({ email }, "Honeypot triggered in newsletter subscription. Silently ignoring.");
      const body: ApiEnvelope = {
        success: true,
        message: "Please check your inbox to confirm your subscription.",
        data: null,
        errors: null,
      };
      res.status(200).json(body);
      return;
    }

    const confirmToken = randomBytes(24).toString("hex");
    const unsubscribeToken = randomBytes(24).toString("hex");

    let subscriber = await NewsletterSubscriber.findOne({ email });

    if (subscriber) {
      if (subscriber.status === "confirmed") {
        const body: ApiEnvelope = {
          success: true,
          message: "You are already subscribed to our newsletter!",
          data: toNewsletterSubscriberDTO(subscriber),
          errors: null,
        };
        res.status(200).json(body);
        return;
      }
      subscriber.status = "pending";
      subscriber.confirmToken = confirmToken;
      await subscriber.save();
    } else {
      subscriber = await NewsletterSubscriber.create({
        email,
        status: "pending",
        confirmToken,
        unsubscribeToken,
        source: "website-footer",
      });
    }

    const confirmUrl = `${env.CLIENT_URL}/newsletter/confirm/${confirmToken}`;
    const confirmationHtml = `
      <div style="font-family: sans-serif; max-width: 600px; color: #181818;">
        <h2 style="color: #5C4033;">Confirm Your Subscription — Forth Urban Insights</h2>
        <p>Thank you for signing up to receive real estate updates, Abuja property market trends, and investment opportunities from Forth Urban Limited.</p>
        <p>Please click the button below to confirm your email address:</p>
        <div style="margin: 24px 0;">
          <a href="${confirmUrl}" style="background-color: #5C4033; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Confirm Subscription</a>
        </div>
        <p style="font-size: 13px; color: #666;">Or copy and paste this link into your browser:<br/><a href="${confirmUrl}" style="color: #5C4033;">${confirmUrl}</a></p>
        <hr style="border: 1px solid #eee; margin: 24px 0;" />
        <p style="font-size: 12px; color: #888;">If you did not make this request, no action is needed. You will not receive any further emails.</p>
      </div>
    `;

    sendEmail({
      to: email,
      subject: "Action Required: Confirm Your Forth Urban Newsletter Subscription",
      html: confirmationHtml,
    }).catch((err) => {
      logger.error({ err, email }, "Failed to send newsletter confirmation email");
    });

    const body: ApiEnvelope = {
      success: true,
      message: "We've sent a confirmation link to your email. Please click it to complete your subscription.",
      data: { email: subscriber.email, status: subscriber.status },
      errors: null,
    };
    res.status(200).json(body);
  } catch (err) {
    next(err);
  }
});

newsletterRouter.get("/confirm/:token", async (req, res, next) => {
  try {
    const { token } = req.params;
    const subscriber = await NewsletterSubscriber.findOne({ confirmToken: token });

    if (!subscriber) {
      const body: ApiEnvelope = {
        success: false,
        message: "Invalid or expired confirmation link.",
        data: null,
        errors: null,
      };
      res.status(404).json(body);
      return;
    }

    subscriber.status = "confirmed";
    subscriber.confirmedAt = new Date();
    await subscriber.save();

    const body: ApiEnvelope = {
      success: true,
      message: "Your subscription is confirmed! You'll now receive Forth Urban market insights.",
      data: toNewsletterSubscriberDTO(subscriber),
      errors: null,
    };
    res.json(body);
  } catch (err) {
    next(err);
  }
});

newsletterRouter.get("/unsubscribe/:token", async (req, res, next) => {
  try {
    const { token } = req.params;
    const subscriber = await NewsletterSubscriber.findOne({ unsubscribeToken: token });

    if (!subscriber) {
      const body: ApiEnvelope = {
        success: false,
        message: "Invalid unsubscribe link.",
        data: null,
        errors: null,
      };
      res.status(404).json(body);
      return;
    }

    subscriber.status = "unsubscribed";
    subscriber.unsubscribedAt = new Date();
    await subscriber.save();

    const body: ApiEnvelope = {
      success: true,
      message: "You have been successfully unsubscribed from Forth Urban emails.",
      data: toNewsletterSubscriberDTO(subscriber),
      errors: null,
    };
    res.json(body);
  } catch (err) {
    next(err);
  }
});
