import { Router } from "express";
import { generateDemandForecast, getForecasts, getOrders, createPurchaseOrder, createSalesOrder } from "../controllers/scmController.js";
import {
  addProductionMaterialToOrder,
  addWipEventToOrder,
  createInventoryStockRecord,
  createOptimizationRecommendation,
  createPartnerCatalogEntry,
  createProductionOrder,
  createShipment,
  createSupplierRelationship,
  listInventoryStock,
  listInventoryOptimizationSuggestions,
  listOptimizationRecommendations,
  listPartnerCatalogEntries,
  listProductionOrders,
  listShipments,
  listSupplierRelationships,
  runInventoryOptimization
} from "../controllers/enterpriseScmController.js";
import { authenticate } from "../middleware/auth.js";
import { requireApprovedBusinessAccess } from "../middleware/rbac.js";

const router = Router();

router.use(authenticate, requireApprovedBusinessAccess());

router.post("/forecasts/generate", generateDemandForecast);
router.get("/forecasts", getForecasts);

router.get("/orders", getOrders);
router.post("/orders", createPurchaseOrder);
router.post("/orders/sales", createSalesOrder);

router.get("/inventory", listInventoryStock);
router.post("/inventory", createInventoryStockRecord);
router.get("/inventory/optimization", listInventoryOptimizationSuggestions);
router.post("/inventory/optimization/run", runInventoryOptimization);

router.get("/supplier-relationships", listSupplierRelationships);
router.post("/supplier-relationships", createSupplierRelationship);

router.get("/partner-catalog", listPartnerCatalogEntries);
router.post("/partner-catalog", createPartnerCatalogEntry);

router.get("/shipments", listShipments);
router.post("/shipments", createShipment);

router.get("/production-orders", listProductionOrders);
router.post("/production-orders", createProductionOrder);
router.post("/production-orders/:id/materials", addProductionMaterialToOrder);
router.post("/production-orders/:id/wip-events", addWipEventToOrder);

router.get("/optimization/recommendations", listOptimizationRecommendations);
router.post("/optimization/recommendations", createOptimizationRecommendation);

export default router;
