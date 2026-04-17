import type { Request, Response } from "express";
import { getProductJourney } from "../services/productService.js";

export async function verifyProductHandler(req: Request, res: Response) {
  const { productId } = req.params;
  const journey = await getProductJourney(productId);
  if (!journey) return res.status(404).json({ error: "Product not found" });

  const status =
    journey.product.authenticityScore >= 95
      ? "verified"
      : journey.product.authenticityScore >= 85
        ? "warning"
        : "suspicious";

  return res.status(200).json({
    status,
    trustScore: journey.product.authenticityScore,
    product: journey.product,
    checkpoints: journey.checkpoints
  });
}
