import { Router } from "express";
import { listConnectors, testConnector, upsertConnector } from "../controllers/integrationController.js";
import { authenticate } from "../middleware/auth.js";
import { requireApprovedBusinessAccess } from "../middleware/rbac.js";

const router = Router();

router.use(authenticate, requireApprovedBusinessAccess());

router.get("/connectors", listConnectors);
router.post("/connectors", upsertConnector);
router.post("/connectors/:id/test", testConnector);

export default router;
