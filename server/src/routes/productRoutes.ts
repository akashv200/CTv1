import { Router } from "express";
import { createProductHandler, getProductJourneyHandler, listProductsHandler } from "../controllers/productController.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();

router.get("/", authenticate, listProductsHandler);
router.post("/", authenticate, createProductHandler);
router.get("/:productId/journey", authenticate, getProductJourneyHandler);

export default router;
