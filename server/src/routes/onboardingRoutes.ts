import { Router } from "express";
import { submitRegistrationRequest, getPendingRequests, approveRequest, rejectRequest, getOnboardingSummary } from "../controllers/onboardingController.js";
import { authenticate } from "../middleware/auth.js";
import { authorize } from "../middleware/rbac.js";

const router = Router();

// Public: Submit a registration request
router.post("/request", submitRegistrationRequest);

router.get("/summary", authenticate, authorize(["super_admin"]), getOnboardingSummary);
router.get("/requests", authenticate, authorize(["super_admin"]), getPendingRequests);
router.post("/requests/:id/approve", authenticate, authorize(["super_admin"]), approveRequest);
router.post("/requests/:id/reject", authenticate, authorize(["super_admin"]), rejectRequest);

export default router;
