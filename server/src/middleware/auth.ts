import type { NextFunction, Request, RequestHandler, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export interface AuthPayload {
  sub: string;
  email: string;
  role: string;
  orgId?: string;
}

export interface AuthenticatedUser extends AuthPayload {
  id: string;
  organizationId?: string | null;
}

declare global {
  namespace Express {
    interface User {
      sub?: string;
      email?: string;
      role?: string;
      orgId?: string;
      id?: string;
      organizationId?: string | null;
    }
  }
}

export type AuthenticatedRequest = Request & {
  user?: AuthenticatedUser;
};

export const authenticate: RequestHandler = (req: Request, res: Response, next: NextFunction) => {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing bearer token" });
  }

  const token = header.slice("Bearer ".length);
  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as AuthPayload;
    req.user = {
      ...payload,
      id: payload.sub,
      organizationId: payload.orgId ?? null
    };
    return next();
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }
};
