import { Router } from "express";
import authRoutes from "./authRoutes.js";
import productRoutes from "./productRoutes.js";
import checkpointRoutes from "./checkpointRoutes.js";
import verificationRoutes from "./verificationRoutes.js";

// PHASE 1 ONLY: Agriculture supply chain traceability
// These routes are explicitly out of scope for v1:
// - aiRoutes (AI anomaly detection)
// - organizationRoutes (multi-tenant orgs)
// - notificationRoutes (notifications)
// - iotRoutes (IoT sensor streams)
// - onboardingRoutes (admin onboarding)
// - b2bRoutes (B2B directory)
// - scmRoutes (enterprise SCM features)
// - integrationRoutes (third-party integrations)
// - userRoutes (will be merged into auth for v1)

const router = Router();

router.get("/health", (_req, res) => res.status(200).json({ ok: true, service: "chaintrace-backend", domain: "agriculture" }));

// PHASE 1 CORE ROUTES
router.use("/auth", authRoutes);
router.use("/products", productRoutes);
router.use("/checkpoints", checkpointRoutes);
router.use("/verify", verificationRoutes);

export default router;
