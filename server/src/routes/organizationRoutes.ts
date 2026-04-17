import { Router } from "express";
import { getMyOrganizationHandler, updateMyOrganizationHandler } from "../controllers/organizationController.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();

router.get("/me", authenticate, getMyOrganizationHandler);
router.put("/me", authenticate, updateMyOrganizationHandler);

export default router;
