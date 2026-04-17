import { Router } from "express";
import { listNotificationsHandler } from "../controllers/notificationController.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();

router.get("/", authenticate, listNotificationsHandler);

export default router;
