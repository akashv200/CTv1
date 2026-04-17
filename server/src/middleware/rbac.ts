import type { NextFunction, RequestHandler, Response } from "express";
import { pgPool } from "../config/postgres.js";
import type { AuthenticatedRequest } from "./auth.js";

export function authorize(roles: string[]): RequestHandler {
  return (req, res: Response, next: NextFunction) => {
    const authReq = req as AuthenticatedRequest;
    if (!authReq.user) return res.status(401).json({ error: "Unauthorized" });
    if (!roles.includes(authReq.user.role)) return res.status(403).json({ error: "Forbidden" });
    return next();
  };
}

const businessNetworkRoles = ["super_admin", "org_admin", "producer", "distributor", "retailer", "inspector", "auditor"];

export function requireApprovedBusinessAccess(): RequestHandler {
  return async (req, res: Response, next: NextFunction) => {
    const authReq = req as AuthenticatedRequest;
    if (!authReq.user) return res.status(401).json({ error: "Unauthorized" });

    if (!businessNetworkRoles.includes(authReq.user.role)) {
      return res.status(403).json({ error: "Business partner access is available only to approved supply-chain members." });
    }

    if (authReq.user.role === "super_admin") return next();

    if (!authReq.user.orgId) {
      return res.status(403).json({ error: "Admin approval is required before accessing the business network." });
    }

    const result = await pgPool.query(
      `
        SELECT 1
        FROM companies
        WHERE id = $1
          AND status = 'active'
        LIMIT 1
      `,
      [authReq.user.orgId]
    );

    if (result.rowCount === 0) {
      return res.status(403).json({ error: "Your organization is not approved for business network access yet." });
    }

    return next();
  };
}
