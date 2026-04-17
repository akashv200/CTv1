import type { Request, Response } from "express";
import type { AuthPayload } from "../middleware/auth.js";
import { listNotificationsByOrganization } from "../services/notificationService.js";

export async function listNotificationsHandler(req: Request, res: Response) {
  const user = req.user as AuthPayload | undefined;
  const limit = req.query.limit ? Number.parseInt(req.query.limit as string) : 20;
  const notifications = await listNotificationsByOrganization(user?.orgId ?? "org-demo", limit);
  return res.status(200).json(notifications);
}
