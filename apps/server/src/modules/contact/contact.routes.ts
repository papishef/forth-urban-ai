import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import { contactMessageSchema } from "@forth-urban/validation";
import type { ApiEnvelope } from "../../middleware/error-handler.js";
import { validateBody } from "../../middleware/validate.js";
import { sendEmail } from "../../lib/email.service.js";
import { env } from "../../config/env.js";
import { logger } from "../../config/logger.js";
import { ContactMessage } from "./contact-message.model.js";

export const contactRouter: Router = Router();

// Abuse protection: limit contact form submissions to 10 per 15 minutes per IP
const contactRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
});

contactRouter.use(contactRateLimiter);

contactRouter.post("/", validateBody(contactMessageSchema), async (req, res, next) => {
  try {
    const { name, email, phone, reason, message, companyWebsite } = req.body;

    // Honeypot check: if companyWebsite is populated, it's an automated bot
    if (companyWebsite) {
      logger.warn({ email, name }, "Honeypot triggered in contact form. Silently ignoring submission.");
      const body: ApiEnvelope = { success: true, message: "Thank you for reaching out! We will be in touch shortly.", data: null, errors: null };
      res.status(200).json(body);
      return;
    }

    const doc = await ContactMessage.create({
      name,
      email,
      phone: phone || null,
      reason,
      message,
      status: "new",
    });

    // Send notification email to admin
    const adminNotificationHtml = `
      <h2>New Contact Inquiry from Forth Urban Website</h2>
      <p><strong>From:</strong> ${name} &lt;${email}&gt;</p>
      <p><strong>Phone:</strong> ${phone || "Not provided"}</p>
      <p><strong>Reason:</strong> ${reason}</p>
      <hr style="border: 1px solid #eee; margin: 16px 0;" />
      <h3>Message:</h3>
      <p style="white-space: pre-wrap;">${message}</p>
      <hr style="border: 1px solid #eee; margin: 16px 0;" />
      <p><small>Received at: ${new Date().toUTCString()} | ID: ${doc._id}</small></p>
    `;

    sendEmail({
      to: env.ADMIN_NOTIFICATION_EMAIL,
      subject: `[Website Inquiry] ${reason.toUpperCase()} - ${name}`,
      html: adminNotificationHtml,
    }).catch((err) => {
      logger.error({ err, contactId: doc._id }, "Failed to send admin contact notification email");
    });

    // Send customer auto-reply
    const clientAckHtml = `
      <div style="font-family: sans-serif; max-width: 600px; color: #181818;">
        <h2 style="color: #5C4033;">Thank you for contacting Forth Urban Limited</h2>
        <p>Dear ${name},</p>
        <p>We have received your message regarding <strong>${reason}</strong>. One of our property advisors will review your inquiry and reach out to you within 24 business hours.</p>
        <div style="background-color: #FFECE4; padding: 16px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0; font-size: 14px;"><strong>Your Message:</strong></p>
          <p style="margin: 8px 0 0; font-size: 14px; font-style: italic;">"${message}"</p>
        </div>
        <p>In the meantime, feel free to explore our <a href="${env.CLIENT_URL}" style="color: #5C4033; font-weight: bold;">AI Property Consultation Engine</a> to check your home-readiness score or calculate land affordability.</p>
        <p>Warm regards,<br/><strong>The Forth Urban Team</strong><br/>Abuja, Nigeria</p>
      </div>
    `;

    sendEmail({
      to: email,
      subject: "We received your message - Forth Urban Limited",
      html: clientAckHtml,
    }).catch((err) => {
      logger.error({ err, to: email }, "Failed to send customer auto-reply email");
    });

    const body: ApiEnvelope = {
      success: true,
      message: "Thank you for reaching out! We have received your message and will respond shortly.",
      data: { id: doc._id.toString() },
      errors: null,
    };
    res.status(201).json(body);
  } catch (err) {
    next(err);
  }
});
