import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import type { AuthPayload } from "../middleware/auth.js";

/**
 * Phase 3: Sign access token (15 minutes)
 */
export function signAccessToken(payload: AuthPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: "15m"
  });
}

/**
 * Phase 3: Sign refresh token (7 days)
 * These are stored in Firestore for revocation checking
 */
export function signRefreshToken(payload: AuthPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: "7d"
  });
}

/**
 * Phase 3: Verify access token
 */
export function verifyAccessToken(token: string): AuthPayload | null {
  try {
    return jwt.verify(token, env.JWT_SECRET) as AuthPayload;
  } catch (error) {
    console.error("[v0] Invalid access token:", error instanceof Error ? error.message : "Unknown error");
    return null;
  }
}

/**
 * Phase 3: Verify refresh token
 */
export function verifyRefreshToken(token: string): AuthPayload | null {
  try {
    return jwt.verify(token, env.JWT_SECRET) as AuthPayload;
  } catch (error) {
    console.error("[v0] Invalid refresh token:", error instanceof Error ? error.message : "Unknown error");
    return null;
  }
}

/**
 * Phase 3: Hash refresh token for secure storage
 * Refresh tokens are stored as hashes in Firestore for revocation
 */
export function hashRefreshToken(token: string): string {
  const { createHash } = require("crypto");
  return createHash("sha256").update(token).digest("hex");
}
