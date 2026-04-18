import type { Request, Response } from "express";
import { z } from "zod";
import { hashPassword, verifyPassword } from "../utils/password.js";
import { signAccessToken, signRefreshToken, verifyRefreshToken, hashRefreshToken } from "../utils/jwt.js";
import { createUser, findUserByEmail, type UserRole } from "../services/userService.js";
import { completePasswordAction, getPasswordTokenInfo, issuePasswordActionToken } from "../services/passwordTokenService.js";
import { db } from "../lib/firebase.js";
import { collection, doc, setDoc, getDoc, deleteDoc } from "firebase/firestore";

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(["consumer"]).default("consumer")
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

const requestPasswordResetSchema = z.object({
  email: z.string().email()
});

const completePasswordActionSchema = z.object({
  token: z.string().min(20),
  password: z.string().min(8)
});

export async function register(req: Request, res: Response) {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid payload", issues: parsed.error.flatten() });

  const existing = await findUserByEmail(parsed.data.email);
  if (existing) return res.status(409).json({ error: "Email already exists" });

  const user = await createUser({
    name: parsed.data.name,
    email: parsed.data.email,
    role: parsed.data.role as UserRole,
    passwordHash: await hashPassword(parsed.data.password)
  });

  return res.status(201).json({
    id: user.id,
    email: user.email,
    role: user.role
  });
}

export async function login(req: Request, res: Response) {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid payload", issues: parsed.error.flatten() });

  const user = await findUserByEmail(parsed.data.email);
  if (!user) return res.status(401).json({ error: "Invalid credentials" });

  const valid = await verifyPassword(parsed.data.password, user.passwordHash);
  if (!valid) return res.status(401).json({ error: "Invalid credentials" });

  const payload = {
    sub: user.id,
    email: user.email,
    role: user.role,
    orgId: user.organizationId ?? undefined
  };

  return res.status(200).json({
    accessToken: signAccessToken(payload),
    refreshToken: signRefreshToken(payload)
  });
}

export async function requestPasswordReset(req: Request, res: Response) {
  const parsed = requestPasswordResetSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid payload", issues: parsed.error.flatten() });

  const user = await findUserByEmail(parsed.data.email);
  if (user) {
    await issuePasswordActionToken({
      userId: user.id,
      email: user.email,
      purpose: "password_reset",
      companyId: user.organizationId ?? null,
      recipientName: user.name
    });
  }

  return res.status(200).json({
    message: "If the account exists, a password reset link has been sent."
  });
}

export async function inspectPasswordToken(req: Request, res: Response) {
  const token = req.params.token;
  if (!token) return res.status(400).json({ error: "Missing token" });

  const tokenInfo = await getPasswordTokenInfo(token);
  if (!tokenInfo) {
    return res.status(404).json({ error: "Token is invalid or expired" });
  }

  return res.status(200).json({
    valid: true,
    email: tokenInfo.email,
    purpose: tokenInfo.purpose,
    name: tokenInfo.name,
    companyName: tokenInfo.companyName ?? null,
    expiresAt: tokenInfo.expiresAt
  });
}

export async function completePasswordFlow(req: Request, res: Response) {
  const parsed = completePasswordActionSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid payload", issues: parsed.error.flatten() });

  try {
    const tokenInfo = await completePasswordAction(parsed.data.token, parsed.data.password);
    return res.status(200).json({
      message: tokenInfo.purpose === "invite_setup" ? "Password set successfully. You can log in now." : "Password reset successfully. You can log in now."
    });
  } catch (error: any) {
    return res.status(400).json({ error: error.message ?? "Failed to complete password action" });
  }
}

/**
 * Phase 3: Refresh access token
 * POST /api/auth/refresh
 * Body: { refreshToken: "..." }
 * Returns new access token
 */
export async function refreshAccessToken(req: Request, res: Response) {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(401).json({ error: "Missing refresh token" });
    }

    // Verify refresh token signature
    const payload = verifyRefreshToken(refreshToken);
    if (!payload) {
      return res.status(401).json({ error: "Invalid or expired refresh token" });
    }

    // Check if token has been revoked in Firestore
    const revokedRef = doc(collection(db, "revokedTokens"), hashRefreshToken(refreshToken));
    const revokedSnapshot = await getDoc(revokedRef);
    
    if (revokedSnapshot.exists()) {
      return res.status(401).json({ error: "Refresh token has been revoked" });
    }

    // Issue new access token
    return res.status(200).json({
      accessToken: signAccessToken(payload)
    });
  } catch (error: any) {
    console.error("[v0] Error refreshing token:", error);
    return res.status(500).json({ error: "Failed to refresh token" });
  }
}

/**
 * Phase 3: Logout and revoke refresh token
 * POST /api/auth/logout
 * Body: { refreshToken: "..." }
 * Stores token hash in revokedTokens collection
 */
export async function logout(req: Request, res: Response) {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ error: "Missing refresh token" });
    }

    // Verify token is valid before revoking
    const payload = verifyRefreshToken(refreshToken);
    if (!payload) {
      return res.status(401).json({ error: "Invalid refresh token" });
    }

    // Store revoked token hash in Firestore
    const tokenHash = hashRefreshToken(refreshToken);
    const revokedRef = doc(collection(db, "revokedTokens"), tokenHash);
    await setDoc(revokedRef, {
      userId: payload.sub,
      revokedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
    });

    return res.status(200).json({
      message: "Logged out successfully"
    });
  } catch (error: any) {
    console.error("[v0] Error logging out:", error);
    return res.status(500).json({ error: "Failed to logout" });
  }
}
