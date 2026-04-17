import { Router } from "express";
import { createCheckpointHandler, listCheckpointsHandler } from "../controllers/checkpointController.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();

router.get("/", authenticate, listCheckpointsHandler);
router.post("/", authenticate, createCheckpointHandler);

export default router;
