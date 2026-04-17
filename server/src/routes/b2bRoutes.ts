import { Router } from "express";
import { addSupplyChainPartner, approveNetworkHandler, createSupplyChainNetwork, deployNetworkHandler, getActiveCompanies, listSupplyChainNetworks } from "../controllers/b2bDirectoryController.js";
import { authenticate } from "../middleware/auth.js";
import { requireApprovedBusinessAccess } from "../middleware/rbac.js";

const router = Router();

router.get("/directory", authenticate, requireApprovedBusinessAccess(), getActiveCompanies);
router.get("/networks", authenticate, requireApprovedBusinessAccess(), listSupplyChainNetworks);
router.post("/networks", authenticate, requireApprovedBusinessAccess(), createSupplyChainNetwork);
router.post("/networks/:id/partners", authenticate, requireApprovedBusinessAccess(), addSupplyChainPartner);
router.post("/networks/:id/approve", authenticate, requireApprovedBusinessAccess(), approveNetworkHandler);
router.post("/networks/:id/deploy", authenticate, requireApprovedBusinessAccess(), deployNetworkHandler);

export default router;
