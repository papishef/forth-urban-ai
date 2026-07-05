import { env } from "../../config/env.js";

/**
 * Generates a `wa.me` click-to-chat deep link pre-filled with a message —
 * docs/PRODUCT_SPEC.md#11-site-inspection-scheduler-the-conversion-event /
 * §14-lead-capture--email-marketing. Deliberately NOT the Meta Cloud API or
 * WhatsApp OTP (AGENTS.md tech-stack rule: "wa.me click-to-chat links only").
 *
 * If `SALES_WHATSAPP_NUMBER` isn't configured, the number segment is omitted
 * so WhatsApp still opens and lets the user pick a contact, rather than
 * producing a broken link.
 */
export function buildWhatsAppLink(message: string): string {
  const encoded = encodeURIComponent(message);
  const number = env.SALES_WHATSAPP_NUMBER?.replace(/[^\d]/g, "");
  return number ? `https://wa.me/${number}?text=${encoded}` : `https://wa.me/?text=${encoded}`;
}
