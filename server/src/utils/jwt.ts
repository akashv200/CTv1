import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import type { AuthPayload } from "../middleware/auth.js";

export function signAccessToken(payload: AuthPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRY as jwt.SignOptions["expiresIn"]
  });
}

export function signRefreshToken(payload: AuthPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.REFRESH_EXPIRY as jwt.SignOptions["expiresIn"]
  });
}
