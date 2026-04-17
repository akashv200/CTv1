import { Router } from "express";
import { listAnomaliesHandler } from "../controllers/aiController.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();

router.get("/insights", authenticate, listAnomaliesHandler);

export default router;
