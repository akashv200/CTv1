import type { Request, Response } from "express";
import { z } from "zod";
import type { AuthPayload } from "../middleware/auth.js";
import { createCheckpoint, listLatestCheckpointsByOrganization } from "../services/checkpointService.js";

const createCheckpointSchema = z.object({
  productId: z.string().min(2),
  checkpointType: z.enum(["received", "quality-check", "processed", "dispatched", "in-transit", "delivered"]),
  location: z.string().min(2),
  temperature: z.number().optional(),
  humidity: z.number().optional(),
  notes: z.string().optional(),
  iotPayload: z.record(z.unknown()).optional()
});

export async function createCheckpointHandler(req: Request, res: Response) {
  const parsed = createCheckpointSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid payload", issues: parsed.error.flatten() });
  const user = req.user as AuthPayload | undefined;
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const checkpoint = await createCheckpoint({
    ...parsed.data,
    addedBy: user.sub
  });

  req.app.get("io")?.emit("checkpoint:created", {
    id: checkpoint.id,
    productId: checkpoint.productId,
    checkpointType: checkpoint.checkpointType,
    location: checkpoint.location,
    timestamp: checkpoint.createdAt.toISOString(),
    temperature: checkpoint.temperature,
    humidity: checkpoint.humidity,
    note: checkpoint.notes,
    txHash: checkpoint.blockchainTxHash
  });

  return res.status(201).json(checkpoint);
}

export async function listCheckpointsHandler(req: Request, res: Response) {
  const user = (req.user as any);
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const limit = req.query.limit ? Number.parseInt(req.query.limit as string) : 20;
  
  // Super Admins see all, others restricted to their org
  const orgId = user.role === "admin" ? undefined : (user.orgId ?? "org-demo");
  const checkpoints = await listLatestCheckpointsByOrganization(orgId as any, limit);

  return res.status(200).json(checkpoints);
}
