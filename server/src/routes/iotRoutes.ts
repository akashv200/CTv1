import { Router } from "express";
import { listIoTDevicesHandler, registerDeviceHandler, ingestReadingHandler } from "../controllers/iotController.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();

router.get("/", authenticate, listIoTDevicesHandler);
router.post("/", authenticate, registerDeviceHandler);
router.post("/reading", ingestReadingHandler);
router.post("/simulation-mode", authenticate, (req, res) => {
  const { enabled } = req.body;
  const { mqttClient } = require("../config/mqtt.js");
  mqttClient.switchSimulationMode(!!enabled);
  res.status(200).json({ ok: true, simulation_enabled: !!enabled });
});

export default router;
