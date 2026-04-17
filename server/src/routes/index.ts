import { Router } from "express";
import authRoutes from "./authRoutes.js";
import productRoutes from "./productRoutes.js";
import checkpointRoutes from "./checkpointRoutes.js";
import verificationRoutes from "./verificationRoutes.js";
import aiRoutes from "./aiRoutes.js";
import organizationRoutes from "./organizationRoutes.js";
import notificationRoutes from "./notificationRoutes.js";
import iotRoutes from "./iotRoutes.js";
import onboardingRoutes from "./onboardingRoutes.js";
import b2bRoutes from "./b2bRoutes.js";
import scmRoutes from "./scmRoutes.js";
import integrationRoutes from "./integrationRoutes.js";
import userRoutes from "./userRoutes.js";

const router = Router();

router.get("/health", (_req, res) => res.status(200).json({ ok: true, service: "chaintrace-backend" }));
router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/products", productRoutes);
router.use("/checkpoints", checkpointRoutes);
router.use("/verify", verificationRoutes);
router.use("/ai", aiRoutes);
router.use("/organization", organizationRoutes);
router.use("/notifications", notificationRoutes);
router.use("/iot", iotRoutes);
router.use("/onboarding", onboardingRoutes);
router.use("/b2b", b2bRoutes);
router.use("/scm", scmRoutes);
router.use("/integrations", integrationRoutes);

export default router;
