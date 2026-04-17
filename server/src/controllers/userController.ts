import type { Request, Response } from "express";
import { getUserById, updateUser } from "../services/userService.js";
import type { AuthPayload } from "../middleware/auth.js";

export async function getMeHandler(req: Request, res: Response) {
  const userPayload = req.user as AuthPayload | undefined;
  if (!userPayload) return res.status(401).json({ error: "Unauthorized" });

  const user = await getUserById(userPayload.sub);
  if (!user) return res.status(404).json({ error: "User not found" });

  const { passwordHash, ...safeUser } = user;
  return res.status(200).json(safeUser);
}

export async function updateMeHandler(req: Request, res: Response) {
  const userPayload = req.user as AuthPayload | undefined;
  if (!userPayload) return res.status(401).json({ error: "Unauthorized" });

  const { name, avatarUrl } = req.body;
  const updated = await updateUser(userPayload.sub, { name, avatarUrl });
  
  if (!updated) return res.status(404).json({ error: "User not found" });

  const { passwordHash, ...safeUser } = updated;
  return res.status(200).json(safeUser);
}
