import type { Request, Response } from "express";
import { listAnomalies } from "../services/aiService.js";
import type { AuthPayload } from "../middleware/auth.js";

export async function listAnomaliesHandler(req: Request, res: Response) {
  const user = req.user as AuthPayload | undefined;
  const limit = req.query.limit ? Number.parseInt(req.query.limit as string) : 10;
  const anomalies = await listAnomalies(user?.orgId ?? "org-demo", limit);
  return res.status(200).json(anomalies);
}
