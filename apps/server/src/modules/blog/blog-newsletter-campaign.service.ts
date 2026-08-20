import { env } from "../../config/env.js";
import { logger } from "../../config/logger.js";
import { sendEmail } from "../../lib/email.service.js";
import { EmailEvent } from "../notifications/email-event.model.js";
import { NewsletterSubscriber } from "../newsletter/newsletter-subscriber.model.js";
import type { BlogPostDocument } from "./blog-post.model.js";

/**
 * Sends a newsletter update to all confirmed subscribers when a new blog post is published.
 */
export async function sendBlogNewsletterCampaign(post: BlogPostDocument): Promise<{ sentCount: number; recipientCount: number }> {
  try {
    const subscribers = await NewsletterSubscriber.find({ status: "confirmed" });

    if (subscribers.length === 0) {
      logger.info({ postId: post._id }, "No confirmed newsletter subscribers to email.");
      return { sentCount: 0, recipientCount: 0 };
    }

    logger.info(
      { postId: post._id, subscriberCount: subscribers.length },
      "Starting blog newsletter campaign dispatch",
    );

    let sentCount = 0;
    const postUrl = `${env.CLIENT_URL}/blog/${post.slug}`;

    for (const sub of subscribers) {
      const unsubscribeUrl = `${env.CLIENT_URL}/newsletter/unsubscribe/${sub.unsubscribeToken}`;

      const emailHtml = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 620px; margin: 0 auto; color: #181818; background-color: #ffffff; border: 1px solid #eaeaea; border-radius: 12px; overflow: hidden;">
          ${
            post.coverImageUrl
              ? `<div style="width: 100%; max-height: 280px; overflow: hidden; background-color: #5C4033;">
                  <img src="${post.coverImageUrl}" alt="${post.title}" style="width: 100%; height: auto; display: block; object-fit: cover;" />
                </div>`
              : ""
          }
          <div style="padding: 28px 24px;">
            <div style="display: inline-block; background-color: #FFECE4; color: #5C4033; font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.05em; padding: 4px 10px; border-radius: 4px; margin-bottom: 12px;">
              ${post.category}
            </div>
            <h1 style="font-size: 22px; color: #181818; margin: 0 0 16px 0; line-height: 1.3;">
              ${post.title}
            </h1>
            <p style="font-size: 15px; color: #444; line-height: 1.6; margin: 0 0 24px 0;">
              ${post.excerpt}
            </p>
            <div>
              <a href="${postUrl}" style="background-color: #5C4033; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px; display: inline-block;">
                Read Full Article &rarr;
              </a>
            </div>
          </div>
          <div style="background-color: #fafafa; padding: 20px 24px; border-top: 1px solid #eaeaea; font-size: 12px; color: #888; text-align: center;">
            <p style="margin: 0 0 8px 0;">You're receiving this because you subscribed to Forth Urban Property & Market Insights.</p>
            <p style="margin: 0;">
              <a href="${unsubscribeUrl}" style="color: #666; text-decoration: underline;">Unsubscribe</a> | 
              <a href="${env.CLIENT_URL}" style="color: #666; text-decoration: underline;">Visit Forth Urban</a>
            </p>
          </div>
        </div>
      `;

      try {
        await sendEmail({
          to: sub.email,
          subject: `[New Article] ${post.title}`,
          html: emailHtml,
        });

        // Record email event for analytics
        await EmailEvent.create({
          userId: sub._id,
          campaign: "blog-newsletter",
          template: post.slug,
          status: "sent",
        }).catch(() => {});

        sentCount++;
      } catch (err) {
        logger.error({ err, email: sub.email, postId: post._id }, "Failed to send newsletter email to subscriber");
        await EmailEvent.create({
          userId: sub._id,
          campaign: "blog-newsletter",
          template: post.slug,
          status: "bounced",
        }).catch(() => {});
      }
    }

    // Mark newsletter as sent on post doc
    post.newsletterSentAt = new Date();
    await post.save();

    logger.info(
      { postId: post._id, sentCount, total: subscribers.length },
      "Completed blog newsletter campaign dispatch",
    );

    return { sentCount, recipientCount: subscribers.length };
  } catch (err) {
    logger.error({ err, postId: post._id }, "Error in sendBlogNewsletterCampaign");
    throw err;
  }
}
