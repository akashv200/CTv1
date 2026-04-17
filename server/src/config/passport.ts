import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { env } from "./env.js";
import { findOrCreateOAuthUser } from "../services/userService.js";

if (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
        callbackURL: "/api/auth/google/callback"
      },
      async (_accessToken, _refreshToken, profile, done) => {
        const email = profile.emails?.[0]?.value;
        if (!email) return done(new Error("No email returned from Google"));

        const user = await findOrCreateOAuthUser({
          email,
          name: profile.displayName ?? "OAuth User",
          oauthProvider: "google",
          oauthId: profile.id,
          role: "producer",
          organizationId: "org-demo"
        });
        return done(null, user);
      }
    )
  );
}

passport.serializeUser((user: unknown, done) => done(null, user));
passport.deserializeUser((obj: unknown, done) => done(null, obj as never));

export default passport;
