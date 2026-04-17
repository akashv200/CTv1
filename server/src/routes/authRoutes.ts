import { Router } from "express";
import passport from "../config/passport.js";
import { completePasswordFlow, inspectPasswordToken, login, register, requestPasswordReset } from "../controllers/authController.js";
import { signAccessToken, signRefreshToken } from "../utils/jwt.js";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/password/request-reset", requestPasswordReset);
router.get("/password/token/:token", inspectPasswordToken);
router.post("/password/complete", completePasswordFlow);
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
