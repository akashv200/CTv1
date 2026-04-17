import { Router } from "express";
import { getMeHandler, updateMeHandler } from "../controllers/userController.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();

router.get("/me", authenticate, getMeHandler);
router.put("/me", authenticate, updateMeHandler);

export default router;
