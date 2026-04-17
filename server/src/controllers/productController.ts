import type { Request, Response } from "express";
import { z } from "zod";
import type { AuthPayload } from "../middleware/auth.js";
import { createProduct, getProductJourney, listProductsByOrganization } from "../services/productService.js";

const createProductSchema = z.object({
  domain: z.enum(["agriculture", "pharmaceutical", "food", "ecommerce", "warehouse"]),
  productName: z.string().min(2),
  category: z.string().optional(),
  description: z.string().optional(),
  batchNumber: z.string().min(2),
  quantity: z.coerce.number().positive(),
  unit: z.string().min(1),
  originLocation: z.string().min(2),
  metadata: z.record(z.unknown()).optional()
});

export async function createProductHandler(req: Request, res: Response) {
  const parsed = createProductSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid payload", issues: parsed.error.flatten() });
  const user = req.user as AuthPayload | undefined;
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const product = await createProduct({
    ...parsed.data,
    organizationId: user.orgId ?? "org-demo",
    createdBy: user.sub
  });

  return res.status(201).json(product);
}

export async function listProductsHandler(req: Request, res: Response) {
  const user = (req.user as any);
  if (!user) return res.status(401).json({ error: "Unauthorized" });
  
  // Super Admins see everything, others see only their org
  const orgId = user.role === "admin" ? undefined : (user.orgId ?? "org-demo");
  const products = await listProductsByOrganization(orgId as any);
  
  return res.status(200).json(products);
}

export async function getProductJourneyHandler(req: Request, res: Response) {
  const { productId } = req.params;
  const journey = await getProductJourney(productId);
  if (!journey) return res.status(404).json({ error: "Product not found" });
  return res.status(200).json(journey);
}
