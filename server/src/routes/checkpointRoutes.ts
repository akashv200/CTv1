import { Router, Request, Response } from "express";
import { authenticate } from "../middleware/auth.js";
import { authorize } from "../middleware/rbac.js";
import { createCheckpoint, getCheckpointsByProductId } from "../services/checkpointService.js";
import { createCheckpointSchema } from "../validators/schemas.js";
import { z } from "zod";

const router = Router();

/**
 * POST /api/checkpoints
 * Add checkpoint to product (logistics handler)
 * SPEC.md: Logistics adds geolocation, timestamp, signature
 * Phase 3: Only logistics/distributor roles can add checkpoints
 */
router.post("/", authenticate, authorize(["logistics", "distributor"]), async (req: Request, res: Response) => {
  try {
    // Validate request body against schema
    const validated = createCheckpointSchema.parse(req.body);

    // Add authenticated handler info
    const input = {
      ...validated,
      handler: {
        ...validated.handler,
        id: req.user?.id || "unknown"
      }
    };

    const checkpoint = await createCheckpoint(input);
    return res.status(201).json({
      success: true,
      checkpointId: checkpoint.id,
      checkpoint
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: "Validation error",
        details: error.errors
      });
    }
    console.error("[v0] Error creating checkpoint:", error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to create checkpoint"
    });
  }
});

/**
 * GET /api/checkpoints/:productId
 * Get checkpoints for a product (authenticated logistics)
 */
router.get("/:productId", authenticate, async (req: Request, res: Response) => {
  try {
    const { productId } = req.params;
    const checkpoints = await getCheckpointsByProductId(productId);

    return res.status(200).json({
      success: true,
      checkpoints
    });
  } catch (error) {
    console.error("[v0] Error fetching checkpoints:", error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch checkpoints"
    });
  }
});

export default router;
