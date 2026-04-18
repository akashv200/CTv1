import { Router } from "express";
import passport from "../config/passport.js";
import { completePasswordFlow, inspectPasswordToken, login, register, requestPasswordReset, refreshAccessToken, logout } from "../controllers/authController.js";
import { signAccessToken, signRefreshToken } from "../utils/jwt.js";
import { authLimiter, passwordLimiter } from "../middleware/authLimiter.js";

const router = Router();

// Phase 3: Apply rate limiting to auth endpoints
router.post("/register", authLimiter, register);
router.post("/login", authLimiter, login);
router.post("/refresh", authLimiter, refreshAccessToken);
router.post("/logout", logout); // No rate limit on logout
router.post("/password/request-reset", passwordLimiter, requestPasswordReset);
router.get("/password/token/:token", inspectPasswordToken);
router.post("/password/complete", passwordLimiter, completePasswordFlow);
router.get("/google", passport.authenticate("google", { scope: ["profile", "email"], session: false }));
router.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: "/login", session: false }),
  (req, res) => {
    const user = req.user as unknown as {
      id: string;
      email: string;
      role: string;
      organizationId?: string | null;
    };
    res.status(200).json({
      accessToken: signAccessToken({
        sub: user.id,
        email: user.email,
        role: user.role,
        orgId: user.organizationId ?? undefined
      }),
      refreshToken: signRefreshToken({
        sub: user.id,
        email: user.email,
        role: user.role,
        orgId: user.organizationId ?? undefined
      })
    });
  }
);

export default router;
