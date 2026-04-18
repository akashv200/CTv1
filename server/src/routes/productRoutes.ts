import { Router, Request, Response } from "express";
import { authenticate } from "../middleware/auth.js";
import { authorize } from "../middleware/rbac.js";
import { createProduct, getProductById } from "../services/productService.js";
import { createProductSchema } from "../validators/schemas.js";
import { z } from "zod";

const router = Router();

/**
 * POST /api/products
 * Register a new agricultural product
 * SPEC.md: Farmer registers product, writes to Firestore, blockchain registers, QR generated
 * Phase 3: Only farmers/producers can register products
 */
router.post("/", authenticate, authorize(["farmer", "producer"]), async (req: Request, res: Response) => {
  try {
    // Validate request body against schema
    const validated = createProductSchema.parse(req.body);

    // Add authenticated farmer ID
    const input = {
      ...validated,
      farmerId: req.user?.id || "unknown"
    };

    const product = await createProduct(input);
    return res.status(201).json({
      success: true,
      productId: product.id,
      product
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: "Validation error",
        details: error.errors
      });
    }
    console.error("[v0] Error creating product:", error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to create product"
    });
  }
});

/**
 * GET /api/products/:productId
 * Get product by ID (farmer dashboard)
 */
router.get("/:productId", authenticate, async (req: Request, res: Response) => {
  try {
    const { productId } = req.params;
    const product = await getProductById(productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        error: "Product not found"
      });
    }

    return res.status(200).json({
      success: true,
      product
    });
  } catch (error) {
    console.error("[v0] Error fetching product:", error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch product"
    });
  }
});

export default router;
