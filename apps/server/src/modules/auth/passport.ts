import type { Request } from "express";
import passport from "passport";
import { Strategy as GoogleStrategy, type Profile } from "passport-google-oauth20";
import { env } from "../../config/env.js";
import { logger } from "../../config/logger.js";
import { User } from "../users/user.model.js";
import { submitHomeReadinessQuiz } from "../quiz/quiz.service.js";
import { consumeGoogleRegistrationIntent } from "./auth.service.js";

/** `info.reason` passed to the callback when a brand-new Google user has no completed quiz. */
export const GOOGLE_QUIZ_REQUIRED = "quiz_required";

if (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
        callbackURL: env.GOOGLE_CALLBACK_URL,
        passReqToCallback: true,
      },
      (
        req: Request,
        _accessToken: string,
        _refreshToken: string,
        profile: Profile,
        done: (err: unknown, user?: Express.User | false, info?: { reason: string }) => void,
      ) => {
        const state = typeof req.query.state === "string" ? req.query.state : null;
        findOrCreateGoogleUser(profile, state, req.ip ?? null)
          .then((user) =>
            user ? done(null, user as unknown as Express.User) : done(null, false, { reason: GOOGLE_QUIZ_REQUIRED }),
          )
          .catch((err) => done(err));
      },
    ),
  );
}

/**
 * Existing accounts sign in normally. A new account is only created when the
 * OAuth round-trip carries a valid registration intent (a completed quiz the
 * client posted to /auth/registration/google-intent before redirecting).
 */
export async function findOrCreateGoogleUser(profile: Profile, intentToken: string | null, ip: string | null) {
  const email = profile.emails?.[0]?.value?.toLowerCase();
  if (!email) throw new Error("Google account has no email");

  let user = await User.findOne({ $or: [{ googleId: profile.id }, { email }] });

  if (user) {
    if (!user.googleId) {
      user.set("googleId", profile.id);
      user.set("emailVerified", true);
      await user.save();
    }
    return user;
  }

  const intent = await consumeGoogleRegistrationIntent(intentToken, { ip });
  if (!intent) {
    logger.warn({ ip, reason: "google_without_quiz" }, "Registration blocked");
    return null;
  }

  user = await User.create({
    firstName: profile.name?.givenName ?? profile.displayName ?? "Forth",
    lastName: profile.name?.familyName ?? "Urban User",
    email,
    authProvider: "google",
    googleId: profile.id,
    emailVerified: true,
  });

  try {
    await submitHomeReadinessQuiz(user._id.toString(), intent.answers, { ip });
  } catch (err) {
    logger.error({ err, userId: user._id.toString() }, "Failed to save Google registration quiz");
  }

  return user;
}

export { passport };
