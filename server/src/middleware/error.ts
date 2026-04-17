import type { NextFunction, Request, Response } from "express";

export function notFound(_req: Request, res: Response) {
  return res.status(404).json({ error: "Route not found" });
}

export function errorHandler(error: Error, _req: Request, res: Response, _next: NextFunction) {
  console.error("[api] Unhandled error", error);
  return res.status(500).json({ error: "Internal server error" });
}
