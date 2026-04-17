import { Router } from "express";
import { verifyProductHandler } from "../controllers/verificationController.js";

const router = Router();

router.get("/:productId", verifyProductHandler);

export default router;
