import { Router, Request, Response } from "express";
import { getProductWithCheckpoints, getProductSummary } from "../services/verificationService.js";

const router = Router();

/**
 * GET /api/verify/:productId
 * Public verification endpoint (NO AUTH)
 * SPEC.md: Consumer scans QR code, sees product + checkpoint timeline
 */
router.get("/:productId", async (req: Request, res: Response) => {
  try {
    const { productId } = req.params;

    // Fetch product with full checkpoint timeline
    const data = await getProductWithCheckpoints(productId);

    if (!data) {
      return res.status(404).json({
        success: false,
        error: "Product not found"
      });
    }

    return res.status(200).json({
      success: true,
      ...data
    });
  } catch (error) {
    console.error("[v0] Error verifying product:", error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to verify product"
    });
  }
});

export default router;
