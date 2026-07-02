import passport from "passport";
import { Strategy as GoogleStrategy, type Profile } from "passport-google-oauth20";
import { env } from "../../config/env.js";
import { User } from "../users/user.model.js";

if (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
        callbackURL: env.GOOGLE_CALLBACK_URL,
      },
      (
        _accessToken: string,
        _refreshToken: string,
        profile: Profile,
        done: (err: unknown, user?: Express.User | false) => void,
      ) => {
        findOrCreateGoogleUser(profile)
          .then((user) => done(null, user as unknown as Express.User))
          .catch((err) => done(err));
      },
    ),
  );
}

async function findOrCreateGoogleUser(profile: Profile) {
  const email = profile.emails?.[0]?.value?.toLowerCase();
  if (!email) throw new Error("Google account has no email");

  let user = await User.findOne({ $or: [{ googleId: profile.id }, { email }] });

  if (!user) {
    user = await User.create({
      firstName: profile.name?.givenName ?? profile.displayName ?? "Forth",
      lastName: profile.name?.familyName ?? "Urban User",
      email,
      authProvider: "google",
      googleId: profile.id,
      emailVerified: true,
    });
  } else if (!user.googleId) {
    user.set("googleId", profile.id);
    user.set("emailVerified", true);
    await user.save();
  }

  return user;
}

export { passport };
